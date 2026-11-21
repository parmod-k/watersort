package expo.modules.agesignals

import com.google.android.gms.tasks.Task
import com.google.android.play.agesignals.AgeSignalsAccessRequest
import com.google.android.play.agesignals.AgeSignalsException
import com.google.android.play.agesignals.AgeSignalsManager
import com.google.android.play.agesignals.AgeSignalsManagerFactory
import com.google.android.play.agesignals.AgeSignalsRequest
import com.google.android.play.agesignals.AgeSignalsResult
import com.google.android.play.agesignals.ApplicableAgeFeaturesRequest
import com.google.android.play.agesignals.model.AgeRangeSource
import com.google.android.play.agesignals.model.AgeSignalsStatus
import com.google.android.play.agesignals.model.ApplicableAgeFeature
import com.google.android.play.agesignals.model.SignificantChangeStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Thin bridge over the Google Play Age Signals API (beta):
 * https://developer.android.com/google/play/age-signals
 *
 * Flow (as in Google's docs):
 *  1. getApplicableAgeFeatures(): does a law (e.g. Texas, Brazil, California from Jan 2027) make
 *     age sharing mandatory for this user?
 *  2. requestAgeSignalsAccess(activity): Play may show its own "share your age range" prompt.
 *  3. checkAgeSignals(): only when step 2 says SHARED.
 *
 * Signals may only be used to give an age-appropriate experience, never for ad targeting,
 * marketing, profiling or analytics (Play's terms for this API).
 */
class AgeSignalsModule : Module() {
  private val manager: AgeSignalsManager by lazy {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    AgeSignalsManagerFactory.create(context.applicationContext)
  }

  override fun definition() = ModuleDefinition {
    Name("AgeSignals")

    /**
     * @param promptOutsideMandatoryRegions when false, the Play prompt is only requested where the
     *   law makes sharing mandatory; elsewhere the result is NOT_REQUESTED.
     */
    AsyncFunction("checkAsync") { promptOutsideMandatoryRegions: Boolean, promise: Promise ->
      val result = mutableMapOf<String, Any?>("mandatory" to false, "status" to "NOT_REQUESTED")

      manager.getApplicableAgeFeatures(ApplicableAgeFeaturesRequest.builder().build())
        .onDone(promise) { features ->
          val mandatory = features.features().contains(ApplicableAgeFeature.MANDATORY_SHARING)
          result["mandatory"] = mandatory
          if (!mandatory && !promptOutsideMandatoryRegions) {
            promise.resolve(result)
            return@onDone
          }

          val activity = appContext.currentActivity
          if (activity == null) {
            promise.reject(CodedException("ERR_NO_ACTIVITY", "No foreground activity to show the Play age prompt", null))
            return@onDone
          }

          val accessRequest = AgeSignalsAccessRequest.builder().setActivity(activity).build()
          manager.requestAgeSignalsAccess(accessRequest).onDone(promise) { access ->
            val status = access.ageSignalsStatus()
            result["status"] = statusName(status)
            if (status != AgeSignalsStatus.SHARED) {
              promise.resolve(result)
              return@onDone
            }
            manager.checkAgeSignals(AgeSignalsRequest.builder().build()).onDone(promise) { signals ->
              result.putAll(toMap(signals))
              promise.resolve(result)
            }
          }
        }
    }
  }

  private fun <T> Task<T>.onDone(promise: Promise, onSuccess: (T) -> Unit) {
    addOnSuccessListener { value ->
      try {
        onSuccess(value)
      } catch (e: Exception) {
        promise.reject(CodedException("ERR_AGE_SIGNALS", e.message ?: "Age signals failed", e))
      }
    }
    addOnFailureListener { e ->
      val code = (e as? AgeSignalsException)?.errorCode
      promise.reject(CodedException("ERR_AGE_SIGNALS_${code ?: "UNKNOWN"}", e.message ?: "Age signals failed", e))
    }
  }

  private fun toMap(r: AgeSignalsResult): Map<String, Any?> = mapOf(
    "ageLower" to r.ageLower(),
    "ageUpper" to r.ageUpper(),
    "ageRangeSource" to when (r.ageRangeSource()) {
      AgeRangeSource.TIER_A -> "TIER_A"
      AgeRangeSource.TIER_B -> "TIER_B"
      AgeRangeSource.TIER_C -> "TIER_C"
      AgeRangeSource.TIER_D -> "TIER_D"
      else -> null
    },
    "significantChangeStatus" to when (r.significantChangeStatus()) {
      SignificantChangeStatus.APPROVED -> "APPROVED"
      SignificantChangeStatus.PENDING -> "PENDING"
      SignificantChangeStatus.DECLINED -> "DECLINED"
      else -> null
    },
    "significantChangeApprovalDate" to r.significantChangeApprovalDate()?.time?.toDouble(),
    "installId" to r.installId(),
  )

  private fun statusName(status: Int?) = when (status) {
    AgeSignalsStatus.SHARED -> "SHARED"
    AgeSignalsStatus.NOT_SHARED -> "NOT_SHARED"
    AgeSignalsStatus.VERIFICATION_REQUIRED -> "VERIFICATION_REQUIRED"
    else -> "UNSPECIFIED"
  }
}

package expo.modules.valitywakeword

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.util.TypedValue
import android.view.View
import android.view.animation.LinearInterpolator
import kotlin.math.sin
import kotlin.random.Random

private const val ACCENT = 0xFF2EE6D6.toInt()
private const val ACCENT_DIM = 0xFF12615C.toInt()
private const val BAR_COUNT = 3

/**
 * Kleines Pendant zu CoreGlyph (vality-app/src/ui/CoreGlyph.tsx) und zur
 * Bixby/Assistant-Ueberlagerung: pulsierender Kern + Wellenbalken, komplett
 * nativ per Canvas gezeichnet - laeuft im WakeWordService, also ohne dass
 * der JS/React-Kontext dafuer laufen muss.
 */
class OverlayView(context: Context, private val onTap: () -> Unit) : View(context) {

  private fun dp(value: Float): Float = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, resources.displayMetrics)

  private val pillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = Color.argb(235, 12, 20, 23)
  }
  private val corePaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeWidth = dp(2f)
    color = ACCENT
    alpha = 220
  }
  private val barPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = ACCENT
  }

  private val pillWidth = dp(112f)
  private val pillHeight = dp(56f)
  private val corePulse = Random.nextFloat() * 1000f
  private var phase = 0f

  private val animator = ValueAnimator.ofFloat(0f, 1f).apply {
    duration = 900
    repeatCount = ValueAnimator.INFINITE
    interpolator = LinearInterpolator()
    addUpdateListener {
      phase = it.animatedValue as Float
      invalidate()
    }
  }

  init {
    setOnClickListener { onTap() }
  }

  fun start() {
    if (!animator.isStarted) animator.start()
  }

  fun stop() {
    animator.cancel()
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(pillWidth.toInt(), pillHeight.toInt())
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val w = width.toFloat()
    val h = height.toFloat()
    val cy = h / 2f

    canvas.drawRoundRect(RectF(0f, 0f, w, h), h / 2f, h / 2f, pillPaint)

    val coreCx = dp(30f)
    val coreR = dp(15f) + sin((phase * 2 * Math.PI + corePulse).toFloat()) * dp(1.5f)
    corePaint.shader = RadialGradient(
      coreCx, cy, coreR, ACCENT, ACCENT_DIM, Shader.TileMode.CLAMP
    )
    canvas.drawCircle(coreCx, cy, coreR, corePaint)
    canvas.drawCircle(coreCx, cy, dp(21f), ringPaint)

    val barBaseX = dp(66f)
    val barGap = dp(11f)
    val barWidth = dp(4.5f)
    for (i in 0 until BAR_COUNT) {
      val t = (phase + i * 0.28f) % 1f
      val amp = (0.35f + 0.65f * kotlin.math.abs(sin(t * Math.PI).toFloat()))
      val barHeight = dp(8f) + amp * dp(20f)
      val left = barBaseX + i * barGap
      canvas.drawRoundRect(
        RectF(left, cy - barHeight / 2f, left + barWidth, cy + barHeight / 2f),
        barWidth / 2f, barWidth / 2f, barPaint
      )
    }
  }
}

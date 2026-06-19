package com.lofficeviewer.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LofficeTeal = Color(0xFF0D7377)
private val LofficeTealDark = Color(0xFF095456)
private val LofficeGold = Color(0xFFC9A227)
private val LofficeBlue = Color(0xFF2B579A)
private val LofficeBg = Color(0xFFF4F6FA)

private val LightColors = lightColorScheme(
    primary = LofficeTeal,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFB8E6E8),
    onPrimaryContainer = LofficeTealDark,
    secondary = LofficeBlue,
    onSecondary = Color.White,
    tertiary = LofficeGold,
    background = LofficeBg,
    surface = Color.White,
    onBackground = Color(0xFF1E293B),
    onSurface = Color(0xFF1E293B),
    outline = Color(0xFFCBD5E1),
)

@Composable
fun LofficeViewerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        content = content,
    )
}

export const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(50),
  heavy: () => navigator.vibrate?.([50, 30, 50]),
  success: () => navigator.vibrate?.([30, 20, 30, 20, 80]),
  pr: () => navigator.vibrate?.([100, 50, 100, 50, 200]),
}

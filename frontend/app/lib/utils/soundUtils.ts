/**
 * Utility functions for playing sounds in the application
 */

// Cache for audio objects to prevent reloading the same sound multiple times
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Play a sound from a given URL
 * @param soundUrl - URL to the sound file
 * @param volume - Volume level (0.0 to 1.0)
 */
export function playSound(soundUrl: string, volume: number = 1.0): void {
  try {
    let audio: HTMLAudioElement;

    // Check if we have a cached version of this sound
    if (audioCache.has(soundUrl)) {
      audio = audioCache.get(soundUrl)!;
      audio.currentTime = 0; // Reset to beginning
    } else {
      // Create new audio element and cache it
      audio = new Audio(soundUrl);
      audioCache.set(soundUrl, audio);
    }

    // Set volume and play
    audio.volume = volume;
    audio.play().catch((error) => {
      console.warn("Failed to play sound:", error);
    });
  } catch (error) {
    console.warn("Error playing sound:", error);
  }
}

/**
 * Play a beep sound
 * @param frequency - Frequency of the beep in Hz (default: 800)
 * @param duration - Duration of the beep in milliseconds (default: 200)
 * @param volume - Volume level (0.0 to 1.0, default: 0.5)
 */
export function playBeep(
  frequency: number = 800,
  duration: number = 200,
  volume: number = 0.5
): void {
  try {
    // Create audio context
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();

    // Create oscillator and gain node
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // Configure oscillator
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    // Configure gain (volume)
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration / 1000
    );

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Start and stop oscillator
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);

    // Resume audio context if suspended (needed for some browsers)
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  } catch (error) {
    console.warn("Error playing beep sound:", error);
    // Fallback to simple beep using playSound if Web Audio API is not available
    playSound("/assets/sounds/beep.mp3", volume);
  }
}

/**
 * Play notification sound
 * @param volume - Volume level (0.0 to 1.0, default: 0.7)
 */
export function playNotificationSound(volume: number = 0.7): void {
  playSound("/assets/sounds/notification.mp3", volume);
}

/**
 * Play collaborator join sound
 * @param volume - Volume level (0.0 to 1.0, default: 0.8)
 */
export function playCollaboratorJoinSound(volume: number = 0.8): void {
  playSound("/assets/sounds/collaborator-join.mp3", volume);
}

import { StateMachine } from '../../Util/StateMachine';
import { clamp } from '../../Math/util';
import { AudioContextFactory } from './AudioContext';
/**
 * Internal class representing a Web Audio AudioBufferSourceNode instance
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
 */
export class WebAudioInstance {
    constructor(_src) {
        this._src = _src;
        this._audioContext = AudioContextFactory.create();
        this._volumeNode = this._audioContext.createGain();
        this._playingPromise = new Promise((resolve) => {
            this._playingResolve = resolve;
        });
        this._stateMachine = StateMachine.create({
            start: 'STOPPED',
            states: {
                PLAYING: {
                    onEnter: ({ data }) => {
                        // Buffer nodes are single use
                        this._createNewBufferSource();
                        this._handleEnd();
                        if (this.loop) {
                            // when looping don't set a duration
                            this._instance.start(0, data.pausedAt * this._playbackRate);
                        }
                        else {
                            this._instance.start(0, data.pausedAt * this._playbackRate, this.duration);
                        }
                        data.startedAt = (this._audioContext.currentTime - data.pausedAt);
                        data.pausedAt = 0;
                    },
                    onState: () => this._playStarted(),
                    onExit: ({ to }) => {
                        // If you've exited early only resolve if explicitly STOPPED
                        if (to === 'STOPPED') {
                            this._playingResolve(true);
                        }
                        // Whenever you're not playing... you stop!
                        this._instance.onended = null; // disconnect the wired on-end handler
                        this._instance.disconnect();
                        this._instance.stop(0);
                        this._instance = null;
                    },
                    transitions: ['STOPPED', 'PAUSED', 'SEEK']
                },
                SEEK: {
                    onEnter: ({ eventData: position, data }) => {
                        data.pausedAt = (position !== null && position !== void 0 ? position : 0) / this._playbackRate;
                        data.startedAt = 0;
                    },
                    transitions: ['*']
                },
                STOPPED: {
                    onEnter: ({ data }) => {
                        data.pausedAt = 0;
                        data.startedAt = 0;
                        this._playingResolve(true);
                    },
                    transitions: ['PLAYING', 'PAUSED', 'SEEK']
                },
                PAUSED: {
                    onEnter: ({ data }) => {
                        // Playback rate will be a scale factor of how fast/slow the audio is being played
                        // default is 1.0
                        // we need to invert it to get the time scale
                        data.pausedAt = (this._audioContext.currentTime - data.startedAt);
                    },
                    transitions: ['PLAYING', 'STOPPED', 'SEEK']
                }
            }
        }, {
            startedAt: 0,
            pausedAt: 0
        });
        this._volume = 1;
        this._loop = false;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this._playStarted = () => { };
        this._playbackRate = 1.0;
        this._createNewBufferSource();
    }
    _createNewBufferSource() {
        this._instance = this._audioContext.createBufferSource();
        this._instance.buffer = this._src;
        this._instance.loop = this.loop;
        this._instance.playbackRate.value = this._playbackRate;
        this._instance.connect(this._volumeNode);
        this._volumeNode.connect(this._audioContext.destination);
    }
    _handleEnd() {
        if (!this.loop) {
            this._instance.onended = () => {
                this._playingResolve(true);
            };
        }
    }
    set loop(value) {
        this._loop = value;
        if (this._instance) {
            this._instance.loop = value;
            if (!this.loop) {
                this._instance.onended = () => {
                    this._playingResolve(true);
                };
            }
        }
    }
    get loop() {
        return this._loop;
    }
    set volume(value) {
        value = clamp(value, 0, 1.0);
        this._volume = value;
        if (this._stateMachine.in('PLAYING') && this._volumeNode.gain.setTargetAtTime) {
            // https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
            // After each .1 seconds timestep, the target value will ~63.2% closer to the target value.
            // This exponential ramp provides a more pleasant transition in gain
            this._volumeNode.gain.setTargetAtTime(value, this._audioContext.currentTime, 0.1);
        }
        else {
            this._volumeNode.gain.value = value;
        }
    }
    get volume() {
        return this._volume;
    }
    /**
     * Returns the set duration to play, otherwise returns the total duration if unset
     */
    get duration() {
        var _a;
        return (_a = this._duration) !== null && _a !== void 0 ? _a : this.getTotalPlaybackDuration();
    }
    /**
     * Set the duration that this audio should play.
     *
     * Note: if you seek to a specific point the duration will start from that point, for example
     *
     * If you have a 10 second clip, seek to 5 seconds, then set the duration to 2, it will play the clip from 5-7 seconds.
     */
    set duration(duration) {
        this._duration = duration;
    }
    isPlaying() {
        return this._stateMachine.in('PLAYING');
    }
    isPaused() {
        return this._stateMachine.in('PAUSED') || this._stateMachine.in('SEEK');
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    play(playStarted = () => { }) {
        this._playStarted = playStarted;
        this._stateMachine.go('PLAYING');
        return this._playingPromise;
    }
    pause() {
        this._stateMachine.go('PAUSED');
    }
    stop() {
        this._stateMachine.go('STOPPED');
    }
    seek(position) {
        this._stateMachine.go('PAUSED');
        this._stateMachine.go('SEEK', position);
    }
    getTotalPlaybackDuration() {
        return this._src.duration;
    }
    getPlaybackPosition() {
        const { pausedAt, startedAt } = this._stateMachine.data;
        if (pausedAt) {
            return pausedAt * this._playbackRate;
        }
        if (startedAt) {
            return (this._audioContext.currentTime - startedAt) * this._playbackRate;
        }
        return 0;
    }
    set playbackRate(playbackRate) {
        this._instance.playbackRate.value = this._playbackRate = playbackRate;
    }
    get playbackRate() {
        return this._instance.playbackRate.value;
    }
}
//# sourceMappingURL=WebAudioInstance.js.map
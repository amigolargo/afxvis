import d3 from 'd3';
import chroma from 'chroma-js';
import _dropWhile from 'lodash/array/dropWhile';
import _first from 'lodash/array/first';
import _map from 'lodash/collection/map';
import _find from 'lodash/collection/find';
import _result from 'lodash/object/result';
import timeout from '../util/timeout';
import encodeS3URI from '../util/encodeS3URI';
import TweenLite from '../../jspm_packages/npm/gsap@1.18.0/src/uncompressed/TweenLite';
import '../../jspm_packages/npm/gsap@1.18.0/src/uncompressed/plugins/CSSPlugin';
import debounce from 'debounce';

export default class AudioActions {
    constructor(el, tracksData) {
        this.el = el;
        this.tracks = tracksData;

        this.$svg = el.getElementsByTagName('svg')[0];
        this.$info = document.getElementById('js-info');
        this.$bars = el.querySelectorAll('.bars li');
        this.$progress = el.querySelectorAll('.progress')[0];
        this.$playBtn = el.querySelectorAll('.info button')[0];
        this.$cloneBars = el.querySelectorAll('.bars-clone li');

        this.color = chroma.scale(['#023699','#026bad','#0fa5c0','#42b899','#94d275','#d6f36d']).domain([1,0]);

        this.startTime;
        this.progress;
        this.elapsed;

        this._trackLoaded = this.trackLoaded.bind(this);
        this._trackMetaLoaded = this.trackMetaLoaded.bind(this);
        this._initTweens = this.initTweens.bind(this);
        this._togglePlay = this.togglePlay.bind(this);

        this.init();
    }

    sizeBars($collection, pitches, duration) {
        let pitchTotal = pitches.reduce((total, n) => total + n, 0);

        pitches.forEach((pitch, i) => {
            TweenLite.to(Array.from($collection)[i], 0.15,
                {css: {height: pitch / pitchTotal * 100 + '%'}, overwrite: 'all'}
            );
        });
    }

    killPitchTweens() {
        for (let $bar of this.$bars) {
            TweenLite.killTweensOf($bar);
        }
    }

    trackProgress(duration) {

        if(!this.trackIsPaused) {

            this.elapsed = performance.now() - this.startTime;
            this.progress = this.elapsed / duration;

            if(this.progress > 2) { // stop progress bar reporting incorrectly before the track timeupdate event
                this.$progress.setAttribute('style', 'width: '+ this.progress / 10 + '%');
            }

            let segment = _first(_map(_dropWhile(this.data, n => {
                return n.start <= (this.elapsed / 1000);
            })));

            if(!!segment && segment.start >= this.elapsed / 1000) {
                this.sizeBars(this.$bars, segment.pitches, segment.duration);
            }
        }

        if(this.progress / 10 < 100) {
            this.loop = requestAnimationFrame(() => this.trackProgress(duration));
        } else {
            this.pauseTrack();
        }
    }

    playTrack() {
        this.audioEl.play();
        this.startTime = performance.now();
        this.$bars[0].parentNode.classList.remove('bars-paused');
        this.$playBtn.classList.add('btn-pause');
        this.trackInit = false;
        if(this.tween) {
            this.tween.resume();
        }
        this.trackIsPaused = false;
    }

    pauseTrack() {
        this.$bars[0].parentNode.classList.add('bars-paused');
        this.audioEl.pause();
        this.killPitchTweens();
        this.$playBtn.classList.remove('btn-pause');
        if(this.tween) {
            this.tween.pause();
        }
        this.trackIsPaused = true;
    }

    togglePlay() {
        if(this.$playBtn.classList.contains('btn-pause')) {
            this.pauseTrack();
        } else {
            this.playTrack();
        }
    }

    bindAudioListeners(file) {
        this.resolveTrack;
        this.rejectTrack;

        var _this = this;

        this.audioEl.setAttribute('src', file);
        this.audioEl.addEventListener('loadedmetadata', this._trackMetaLoaded);
        this.audioEl.addEventListener('timeupdate', this._initTweens);

        let loadProgress = setInterval(function() {
            if(_this.audioEl.readyState >= 2) {
                clearInterval(loadProgress);
                _this.trackLoaded();
            }
        }, 50);

        return new Promise(function(resolve, reject) { // resolved externally in trackMetaLoaded()
            this.resolveTrackMeta = resolve;
            this.rejectTrackMeta = reject;
        }.bind(this));
    }

    removeAudioListeners() {
        cancelAnimationFrame(this.loop);

        this.audioEl.removeEventListener('loadedmetadata', this._trackMetaLoaded);
        this.audioEl.removeEventListener('canplay', this._trackLoaded);
        this.audioEl.removeEventListener('timeupdate', this._initTweens);
        this.$playBtn.removeEventListener('click', this._togglePlay);
    }

    initTweens() {

        if(this.audioEl.currentTime > 0 && !this.trackInit) {

            let elapsed = this.audioEl.currentTime,
                finalSegmentStart = this.data[this.data.length - 1].start,
                elapsedPercent = (elapsed / finalSegmentStart) * 100;

            this.startTime = performance.now() - elapsed * 1000;
            this.trackInit = true;

            this.tween = TweenLite.fromTo([this.$svg, this.$cloneBars[0]], finalSegmentStart - elapsed,
                {x: -this.chartWidth * elapsedPercent / 100},
                {x: -this.chartWidth, ease: Linear.easeNone}
            );

            requestAnimationFrame(() => this.trackProgress(this.audioEl.duration));
        }
    }

    resetTweens() {
        TweenLite.set([this.$svg, this.$cloneBars[0]], {x: 0});
        TweenLite.killTweensOf([this.$svg, this.$cloneBars[0]]);
    }

    resetTrack() {
        this.pauseTrack();
        this.trackInit = false;
        this.$progress.setAttribute('style', 'width: 0');
        this.resetTweens();
        this.removeAudioListeners();
    }

    trackMetaLoaded() {
        this.resolveTrackMeta();
    }

    trackLoaded() {
        let pitches = this.data[0].pitches;

        this.sizeBars(this.$bars, pitches);
        this.sizeBars(this.$cloneBars, pitches);
        this.$playBtn.addEventListener('click', this._togglePlay);
    }

    initTrack(segments, trackId, width) {
        return new Promise((resolve, reject) => {
            this.data = segments;
            this.trackId = trackId;
            this.chartHeight = document.documentElement.clientHeight;
            this.chartWidth = width;

            let host = 'https://s3-us-west-2.amazonaws.com/afxvis.io/',
                filename = _result( _find(this.tracks, 'en_id', this.trackId), 'filename');

            filename = encodeS3URI(filename);

            if (window.location.port === '9090') {
                host = '/';
            } else {
                filename = filename.split(' ').join('+');
            }

            let URL = host + 'mp3/96kbps/' + filename;

            this.resetTrack();
            this.bindAudioListeners(URL).then(() => resolve());

            // timeout(1).then(() => this.playTrack());
        });
    }

    init() {
        const _this = this;

        this.audioEl = document.createElement('audio');

        Array.from(this.$bars).forEach(($bar, index) => {
            $bar.style.backgroundColor = this.color(index % 12 / 12).hex();
        });

        window.onfocus = function() {
            if(!_this.trackIsPaused) {
                _this.pauseTrack();
                _this.playTrack();
            }
        }

        window.onresize = debounce(function() {
            location.reload(true);
        }, 200);
    }
}
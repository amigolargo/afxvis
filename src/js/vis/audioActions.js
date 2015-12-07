import d3 from 'd3';
import SC from 'soundcloud';
import chroma from 'chroma-js';
import _ from 'lodash';
import TweenLite from '../../jspm_packages/npm/gsap@1.18.0/src/uncompressed/TweenLite';
import '../../jspm_packages/npm/gsap@1.18.0/src/uncompressed/plugins/CSSPlugin';

export default class AudioActions {
    constructor(el, tracksData) {
        this.el = el;
        this.tracks = tracksData;

        this.$svg = el.getElementsByTagName('svg')[0];
        this.$info = document.getElementById('js-info');
        this.$bars = el.querySelectorAll('.bars li');
        this.$progress = el.getElementsByTagName('progress')[0];
        this.$playBtn = el.querySelectorAll('.info button')[0];
        this.$cloneBars = el.querySelectorAll('.bars-clone li');

        this.color = chroma.scale(['#023699','#026bad','#0fa5c0','#42b899','#94d275','#d6f36d']).domain([1,0]);

        this.startTime;
        this.progress;
        this.elapsed;

        this.init();
    }

    sizeBars($collection, pitches, duration) {
        let pitchTotal = pitches.reduce((total, n) => total + n, 0);

        pitches.forEach((pitch, i) => {
            TweenLite.to(Array.from($collection)[i], duration,
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
            this.$progress.setAttribute('value', this.progress / 10);

            let segment = _.first(_.map(_.dropWhile(this.data, n => {
                return n.start <= (this.elapsed / 1000);
            })));

            if(!!segment && segment.start >= this.elapsed / 1000) {
                this.sizeBars(this.$bars, segment.pitches, segment.duration);
            }
        }

        this.loop = requestAnimationFrame(() => this.trackProgress(duration));
    }

    playTrack() {
        this.audioEl.play();
        this.$bars[0].parentNode.classList.remove('bars-paused');
        this.$playBtn.classList.add('btn-pause');
        this.trackInit = false;
        this.trackIsPaused = false;
        if(this.tween) {
            this.tween.resume();
        }
    }

    pauseTrack() {
        this.$bars[0].parentNode.classList.add('bars-paused');
        this.audioEl.pause();
        this.killPitchTweens();
        this.$playBtn.classList.remove('btn-pause');
        this.trackIsPaused = true;

        if(this.tween) {
            this.tween.pause();
        }
    }

    togglePlay() {
        if(this.$playBtn.classList.contains('btn-pause')) {
            this.pauseTrack();
        } else {
            this.playTrack();
        }
    }

    bindAudioListeners(file) {
        this.audioEl.setAttribute('src', file);

        this.trackLoaded = this.trackLoaded.bind(this);
        this.initTweens = this.initTweens.bind(this);

        this.audioEl.addEventListener('canplaythrough', this.trackLoaded);
        this.audioEl.addEventListener('timeupdate', this.initTweens);
    }

    removeAudioListeners() {
        cancelAnimationFrame(this.loop);
        this.audioEl.removeEventListener('canplaythrough', this.trackLoaded);
        this.audioEl.removeEventListener('timeupdate', this.initTweens);
        this.$playBtn.removeEventListener('click', this.togglePlay);
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
        this.$progress.setAttribute('value', 0);
        this.resetTweens();
        this.removeAudioListeners();
    }

    trackLoaded() {
        let pitches = this.data[0].pitches;

        this.sizeBars(this.$bars, pitches);
        this.sizeBars(this.$cloneBars, pitches);

        this.togglePlay = this.togglePlay.bind(this);
        this.$playBtn.addEventListener('click', this.togglePlay);
    }

    initTrack(segments, trackId, width) {

        this.data = segments;
        this.trackId = trackId;
        this.chartHeight = document.documentElement.clientHeight;
        this.chartWidth = width;

        let host = 'https://s3-us-west-2.amazonaws.com/afxvis.io/',
            filename = _.result( _.find(this.tracks, 'en_id', this.trackId), 'filename');

        if (window.location.port === '9090' &&
            window.location.hostname === '127.0.0.1') {
            host = '/';
        } else {
            filename = filename.split(' ').join('+');
        }

        let URL = host + 'mp3/96kbps/' + filename;

        this.resetTrack();
        this.bindAudioListeners(URL);
    }

    init() {
        this.audioEl = document.createElement('audio');
        Array.from(this.$bars).forEach(($bar, index) => {
            $bar.style.backgroundColor = this.color(index % 12 / 12).hex();
        });
    }
}
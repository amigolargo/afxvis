import d3 from 'd3';
import SC from 'soundcloud';
import chroma from 'chroma-js';
import _ from 'lodash';
import TweenLite from '../../jspm_packages/npm/gsap@1.18.0/src/uncompressed/TweenLite';
import '../../jspm_packages/npm/gsap@1.18.0/src/uncompressed/plugins/CSSPlugin';

export default class AudioActions {
    constructor(el, data, trackId, width) {
        this.el = el;
        this.data = data[0].segments;
        this.tracks = data[1];
        this.trackId = trackId;

        this.$svg = el.getElementsByTagName('svg')[0];
        this.$info = document.getElementById('js-info');
        this.$bars = el.querySelectorAll('.bars li');
        this.$progress = el.getElementsByTagName('progress')[0];
        this.$playBtn = el.querySelectorAll('.info button')[0];
        this.$cloneBars = el.querySelectorAll('.bars-clone li');

        this.chartHeight = document.documentElement.clientHeight;
        this.chartWidth = width;
        this.color = chroma.scale(['#023699','#026bad','#0fa5c0','#42b899','#94d275','#d6f36d']).domain([1,0]);

        this.trackInit = false,
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

            if(segment.start >= this.elapsed / 1000) {
                this.sizeBars(this.$bars, segment.pitches, segment.duration);
            }
        }

        requestAnimationFrame(() => this.trackProgress(duration));
    }

    togglePlay() {
        if(!this.$playBtn.classList.contains('btn-pause')) {
            this.audioEl.play();
            this.$bars[0].parentNode.classList.remove('bars-paused');
            this.$playBtn.classList.add('btn-pause');
            this.trackInit = false;
            this.trackIsPaused = false;
            if(this.tween) {
                this.tween.resume();
            }
        } else {
            this.$bars[0].parentNode.classList.add('bars-paused');
            this.tween.pause();
            this.audioEl.pause();
            this.killPitchTweens();
            this.$playBtn.classList.remove('btn-pause');
            this.trackIsPaused = true;
        }
    }

    init() {

        let file = '/mp3/96kbps/' +
            _.result( _.find(this.tracks, 'en_id', this.trackId), 'filename');

        this.audioEl = document.createElement('audio');

        Array.from(this.$bars).forEach(($bar, index) => {
            $bar.style.backgroundColor = this.color(index % 12 / 12).hex();
        });

        this.audioEl.setAttribute('src', file);
        this.audioEl.addEventListener('canplaythrough', event => {
            let pitches = this.data[0].pitches;

            this.sizeBars(this.$bars, pitches);
            this.sizeBars(this.$cloneBars, pitches);

            this.$playBtn.addEventListener('click', () => this.togglePlay(), false);
        });

        this.audioEl.addEventListener('timeupdate', event => {
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
        });

    }
}
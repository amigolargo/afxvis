import doT from 'dot';
import VisManager from './visManager';
import Preloader from './preloader';
import * as template from './template';
import TweenLite from '../jspm_packages/npm/gsap@1.18.0/src/uncompressed/TweenLite';
import '../jspm_packages/npm/gsap@1.18.0/src/uncompressed/plugins/CSSPlugin';

export default class Navigation {
    constructor(nav) {
        this.vis = [];
        this.nav = nav;
        this.links = nav.querySelectorAll('a');
        this.visManager = new VisManager();
        this.preloader = new Preloader('preloader');

        for(let a of this.links) {
			let href = a.getAttribute('href');
			this.vis.push(href.split('/')[2]);
		}
    }
    goto(request) {
        this.initSlide(request).then(() => this.navigate(request));
    }
    initSlide(request) {
        return new Promise((resolve, reject) => {
            let visName = this.getName(request);
            this.preloader.show();

            template.loadAndRender({
                elem: document.querySelector(`.vis-${visName}`),
                view: visName
            })
            .then((response) => {
                if(response === 'loaded') {
                    this.visManager.init(visName, request).then(() => resolve());
                } else if(response === 'cached') {
                    this.visManager.replay(visName, request).then(() => resolve());
                }
            });
        });

    }
    navigate(request) {
        this.preloader.hide();

        for(let a of this.links) {
            a.classList.add('a-disabled');
        }

        this.slideNavigation(request).then(() => {
            for(let a of this.links) {
                a.classList.remove('a-disabled');
            }
        });
    }
    slideNavigation(request) {
        let visName = this.getName(request),
            visIndex = this.getIndex(visName),
            navDirection = this.getDirection(visIndex),
            prevEl = document.querySelector('.vis-current'),
            nextEl = document.querySelector(`.vis-${visName}`),
            docHeight = document.documentElement.clientHeight;

        return new Promise((resolve, reject) => {

            if (navDirection !== 'none') {

                let prevElOffsetY = navDirection === 'fwd' ? - docHeight : docHeight,
                    nextElOffsetY = navDirection === 'fwd' ? docHeight : - docHeight;

                prevEl.classList.remove('vis-current');
                nextEl.classList.add('vis-current');

                this.animateVisSlide(prevEl, 0, prevElOffsetY);
                this.animateVisSlide(nextEl, nextElOffsetY, 0)
                    .then(() => resolve());

            } else {
                nextEl.classList.add('vis-current');
                resolve();
            }
        });
    }
    animateVisSlide(el, fromY, toY) {
        return new Promise((resolve, reject) => {
            TweenLite.fromTo(el, 1, {y: fromY}, {y: toY, onComplete: resolve});
        });
    }
    getName(request) {
    	return request.match.input.split('/')[1];
    }
    getIndex(name) {
    	return this.vis.indexOf(name);
    }
    getDirection(index) {
    	if(this.currentIndex === undefined) {
    		this.currentIndex = index;
    	} else {
    		this.prevIndex = this.currentIndex;
    		this.currentIndex = index;
    		this.navDirection = this.currentIndex > this.prevIndex ? 'fwd' : 'back';
    	}

    	return this.navDirection === undefined ? 'none' : this.navDirection;
    }
}
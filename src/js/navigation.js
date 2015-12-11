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
        this.navBtn = nav.querySelector('button');
        this.main = document.querySelector('[role="main"]');
        this.visManager = new VisManager();
        this.preloader = new Preloader('preloader');

        this._toggleNav = this.toggleNav.bind(this);

        for(let a of this.links) {
			let href = a.getAttribute('href');
			this.vis.push(href.split('/')[2]);
		}

        this.init();
    }
    toggleNav() {
        if(this.nav.classList.contains('nav-animating')) {
            return false;
        } else if(this.nav.classList.contains('nav-visible')) {
            this.hideNav();
        } else {
            this.showNav();
        }
    }
    showNav() {
        let navWidth = this.nav.offsetWidth;
        this.nav.classList.add('nav-animating', 'nav-visible');
        TweenLite.to(this.nav, .8, {x: navWidth, ease: Cubic.easeOut});
        TweenLite.to(this.main, .8, {x: navWidth, ease: Quad.easeOut, onCompleteScope: this, onComplete: function() {
            this.nav.classList.remove('nav-animating');
        }});
    }
    hideNav() {
        this.nav.classList.remove('nav-visible');
        TweenLite.to([this.main, this.nav], .8, {x: 0, ease: Cubic.easeOut});
    }
    goto(request) {
        this.initSlide(request).then(() => {
            this.navigate(request);
            this.main.classList.add('js-loaded');
        });
    }
    initSlide(request) {
        return new Promise((resolve, reject) => {
            let visName = this.getName(request);

            if (visName === 'audio') {
                this.preloader.show();
            }

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
        this.hideNav();

        for(let a of this.links) {
            a.classList.remove('a-active');
            a.classList.add('a-disabled');
        }

        document.querySelector(`[href*='/#/${request.match.input.split('/')[1]}']`)
            .classList.add('a-active');

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

            this.preloader.hide();

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
    init() {
        this.navBtn.addEventListener('click', this._toggleNav);
    }
}
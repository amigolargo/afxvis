import timeout from './util/timeout';
import TweenLite from '../jspm_packages/npm/gsap@1.18.0/src/uncompressed/TweenLite';
import '../jspm_packages/npm/gsap@1.18.0/src/uncompressed/plugins/CSSPlugin';

export default class Preloader {
    constructor(cssClass) {
        this.el = document.getElementsByClassName(cssClass)[0];
    }
    show() {
        this.el.classList.add('preloader-visible');
        timeout(0.05).then(() => {
            this.el.classList.add('preloader-fadein');
        });
    }
    hide() {
        this.el.classList.remove('preloader-fadein');
        timeout(0.3).then(() => {
            this.el.classList.remove('preloader-visible');
        });
    }
}
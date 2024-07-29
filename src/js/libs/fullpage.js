import { isMobile } from "../files/functions.js";
import { flsModules } from "../files/modules.js";

/*
	data-fp - оболонка
	data-fp-section - секції

	Перехід на певний слайд
	fpage.switchingSection(id);

	Встановлення z-index
	fPage.init();
	fPage.destroy();
	fPage.setZIndex();

	id активного слайду
	fPage.activeSectionId
	Активний слайд
	fPage.activeSection

	Події
	fpinit
	fpdestroy
	fpswitching
*/

// Клас FullPage
export class FullPage {
	constructor(element, options) {
		let config = {
			noEventSelector: '[data-no-event]',
			classInit: 'fp-init',
			wrapperAnimatedClass: 'fp-switching',
			selectorSection: '[data-fp-section]',
			activeClass: 'active-section',
			previousClass: 'previous-section',
			nextClass: 'next-section',
			idActiveSection: 0,
			mode: element.dataset.fpEffect ? element.dataset.fpEffect : 'slider',
			bullets: element.hasAttribute('data-fp-bullets') ? true : false,
			bulletsClass: 'fp-bullets',
			bulletClass: 'fp-bullet',
			bulletActiveClass: 'fp-bullet-active',
			onInit: function () { },
			onSwitching: function () { },
			onDestroy: function () { },
			resize: function () {
				setScrollType();
			},
		}
		this.options = Object.assign(config, options);
		this.wrapper = element;
		this.sections = this.wrapper.querySelectorAll(this.options.selectorSection);
		this.activeSection = false;
		this.activeSectionId = false;
		this.previousSection = false;
		this.previousSectionId = false;
		this.nextSection = false;
		this.nextSectionId = false;
		this.bulletsWrapper = false;
		this.stopEvent = false;

		this.pageSlider = {
			params: {
				freeMode: false
			},
			slides: this.sections
		};

		this.events = null;
		this.checkScreenSize(true);
		window.addEventListener('resize', this.checkScreenSize.bind(this));
	}

	checkScreenSize(initial = false) {
		if (window.innerWidth <= 767.98) {
			if (document.documentElement.classList.contains(this.options.classInit) || initial) {
				this.destroy();
			}
		} else {
			if (!document.documentElement.classList.contains(this.options.classInit) || initial) {
				this.init();
			}
		}
	}

	init() {
		if (this.options.idActiveSection > (this.sections.length - 1)) return;
		this.setId();
		this.activeSectionId = this.options.idActiveSection;
		this.setEffectsClasses();
		this.setClasses();
		this.setStyle();
		if (this.options.bullets) {
			this.setBullets();
			this.setActiveBullet(this.activeSectionId);
		}

		if (!this.events) {
			this.events = {
				wheel: this.wheel.bind(this),
				touchdown: this.touchDown.bind(this),
				touchup: this.touchUp.bind(this),
				touchmove: this.touchMove.bind(this),
				touchcancel: this.touchUp.bind(this),
				transitionEnd: this.transitionend.bind(this),
				click: this.clickBullets.bind(this),
			};
		}

		this.setEvents();

		setTimeout(() => {
			document.documentElement.classList.add(this.options.classInit);
			this.options.onInit(this);
			document.dispatchEvent(new CustomEvent("fpinit", {
				detail: { fp: this }
			}));
			setScrollType(this.wrapper, this.pageSlider);
		}, 0);
	}

	destroy() {
		if (this.events) {
			this.removeEvents();
		}
		this.removeClasses();
		document.documentElement.classList.remove(this.options.classInit);
		this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
		this.removeEffectsClasses();
		this.removeZIndex();
		this.removeStyle();
		this.removeId();
		this.options.onDestroy(this);
		document.dispatchEvent(new CustomEvent("fpdestroy", {
			detail: { fp: this }
		}));
	}

	setId() {
		this.sections.forEach((section, index) => {
			section.setAttribute('data-fp-id', index);
		});
	}

	removeId() {
		this.sections.forEach(section => {
			section.removeAttribute('data-fp-id');
		});
	}

	setClasses() {
		this.previousSectionId = this.activeSectionId > 0 ? this.activeSectionId - 1 : false;
		this.nextSectionId = this.activeSectionId < this.sections.length - 1 ? this.activeSectionId + 1 : false;

		this.activeSection = this.sections[this.activeSectionId];
		this.activeSection.classList.add(this.options.activeClass);

		this.sections.forEach((section, index) => {
			document.documentElement.classList.remove(`fp-section-${index}`);
		});
		document.documentElement.classList.add(`fp-section-${this.activeSectionId}`);

		if (this.previousSectionId !== false) {
			this.previousSection = this.sections[this.previousSectionId];
			this.previousSection.classList.add(this.options.previousClass);
		}

		if (this.nextSectionId !== false) {
			this.nextSection = this.sections[this.nextSectionId];
			this.nextSection.classList.add(this.options.nextClass);
		}
	}

	removeClasses() {
		this.sections.forEach(section => {
			section.classList.remove(this.options.activeClass, this.options.previousClass, this.options.nextClass);
		});
	}

	setEffectsClasses() {
		switch (this.options.mode) {
			case 'slider':
				this.wrapper.classList.add('slider-mode');
				break;
			case 'cards':
				this.wrapper.classList.add('cards-mode');
				this.setZIndex();
				break;
			case 'fade':
				this.wrapper.classList.add('fade-mode');
				this.setZIndex();
				break;
		}
	}

	removeEffectsClasses() {
		this.wrapper.classList.remove('slider-mode', 'cards-mode', 'fade-mode');
	}

	setStyle() {
		switch (this.options.mode) {
			case 'slider':
				this.styleSlider();
				break;
			case 'cards':
				this.styleCards();
				break;
			case 'fade':
				this.styleFade();
				break;
		}
	}

	styleSlider() {
		this.sections.forEach((section, index) => {
			if (index === this.activeSectionId) {
				section.style.transform = 'translate3D(0,0,0)';
			} else if (index < this.activeSectionId) {
				section.style.transform = 'translate3D(0,-100%,0)';
			} else {
				section.style.transform = 'translate3D(0,100%,0)';
			}
		});
	}

	styleCards() {
		this.sections.forEach((section, index) => {
			section.style.transform = index >= this.activeSectionId ? 'translate3D(0,0,0)' : 'translate3D(0,-100%,0)';
		});
	}

	styleFade() {
		this.sections.forEach((section, index) => {
			if (index === this.activeSectionId) {
				section.style.opacity = '1';
				section.style.pointerEvents = 'all';
			} else {
				section.style.opacity = '0';
				section.style.pointerEvents = 'none';
			}
		});
	}

	removeStyle() {
		this.sections.forEach(section => {
			section.style.opacity = '';
			section.style.visibility = '';
			section.style.transform = '';
		});
	}

	checkScroll(yCoord, element) {
		this.goScroll = false;
		if (!this.stopEvent && element) {
			this.goScroll = true;
			if (this.haveScroll(element)) {
				this.goScroll = false;
				const position = Math.round(element.scrollHeight - element.scrollTop);
				if (((Math.abs(position - element.scrollHeight) < 2) && yCoord <= 0) || ((Math.abs(position - element.clientHeight) < 2) && yCoord >= 0)) {
					this.goScroll = true;
				}
			}
		}
	}

	haveScroll(element) {
		return element.scrollHeight !== window.innerHeight;
	}

	setEvents() {
		if (this.events.wheel) this.wrapper.addEventListener('wheel', this.events.wheel);
		if (this.events.touchdown) this.wrapper.addEventListener('touchstart', this.events.touchdown);
		if (this.events.touchup) this.wrapper.addEventListener('touchend', this.events.touchup);
		if (this.events.touchcancel) this.wrapper.addEventListener('touchcancel', this.events.touchcancel);
		if (this.events.touchmove) this.wrapper.addEventListener('touchmove', this.events.touchmove);
		if (this.options.bullets && this.bulletsWrapper && this.events.click) {
			this.bulletsWrapper.addEventListener('click', this.events.click);
		}
	}

	removeEvents() {
		if (this.events) {
			if (this.events.wheel) this.wrapper.removeEventListener('wheel', this.events.wheel);
			if (this.events.touchdown) this.wrapper.removeEventListener('touchstart', this.events.touchdown);
			if (this.events.touchup) this.wrapper.removeEventListener('touchend', this.events.touchup);
			if (this.events.touchcancel) this.wrapper.removeEventListener('touchcancel', this.events.touchcancel);
			if (this.events.touchmove) this.wrapper.removeEventListener('touchmove', this.events.touchmove);
			if (this.bulletsWrapper && this.events.click) {
				this.bulletsWrapper.removeEventListener('click', this.events.click);
			}
		}
	}

	clickBullets(e) {
		const bullet = e.target.closest(`.${this.options.bulletClass}`);
		if (bullet) {
			const arrayChildren = Array.from(this.bulletsWrapper.children);
			const idClickBullet = arrayChildren.indexOf(bullet);
			this.switchingSection(idClickBullet);
		}
	}

	setActiveBullet(idButton) {
		if (!this.bulletsWrapper) return;
		const bullets = this.bulletsWrapper.children;
		Array.from(bullets).forEach((bullet, index) => {
			bullet.classList.toggle(this.options.bulletActiveClass, index === idButton);
		});
	}

	touchDown(e) {
		this._yP = e.changedTouches[0].pageY;
		this._eventElement = e.target.closest(`.${this.options.activeClass}`);
		if (this._eventElement) {
			this._eventElement.addEventListener('touchend', this.events.touchup);
			this._eventElement.addEventListener('touchcancel', this.events.touchup);
			this._eventElement.addEventListener('touchmove', this.events.touchmove);
			this.clickOrTouch = true;

			if (isMobile.iOS()) {
				if (this._eventElement.scrollHeight !== this._eventElement.clientHeight) {
					if (this._eventElement.scrollTop === 0) {
						this._eventElement.scrollTop = 1;
					}
					if (this._eventElement.scrollTop === this._eventElement.scrollHeight - this._eventElement.clientHeight) {
						this._eventElement.scrollTop = this._eventElement.scrollHeight - this._eventElement.clientHeight - 1;
					}
				}
				this.allowUp = this._eventElement.scrollTop > 0;
				this.allowDown = this._eventElement.scrollTop < (this._eventElement.scrollHeight - this._eventElement.clientHeight);
				this.lastY = e.changedTouches[0].pageY;
			}
		}
	}

	touchMove(e) {
		const targetElement = e.target.closest(`.${this.options.activeClass}`);
		if (isMobile.iOS()) {
			let up = e.changedTouches[0].pageY > this.lastY;
			let down = !up;
			this.lastY = e.changedTouches[0].pageY;
			if (targetElement) {
				if ((up && this.allowUp) || (down && this.allowDown)) {
					e.stopPropagation();
				} else if (e.cancelable) {
					e.preventDefault();
				}
			}
		}
		if (!this.clickOrTouch || e.target.closest(this.options.noEventSelector)) return;
		let yCoord = this._yP - e.changedTouches[0].pageY;
		this.checkScroll(yCoord, targetElement);
		if (this.goScroll && Math.abs(yCoord) > 20) {
			this.choiceOfDirection(yCoord);
		}
	}

	touchUp(e) {
		this._eventElement.removeEventListener('touchend', this.events.touchup);
		this._eventElement.removeEventListener('touchcancel', this.events.touchup);
		this._eventElement.removeEventListener('touchmove', this.events.touchmove);
		this.clickOrTouch = false;
	}

	transitionend(e) {
		this.stopEvent = false;
		document.documentElement.classList.remove(this.options.wrapperAnimatedClass);
		this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
	}

	wheel(e) {
		if (e.target.closest(this.options.noEventSelector)) return;
		const yCoord = e.deltaY;
		const targetElement = e.target.closest(`.${this.options.activeClass}`);
		this.checkScroll(yCoord, targetElement);
		if (this.goScroll) this.choiceOfDirection(yCoord);
	}

	choiceOfDirection(direction) {
		if (direction > 0 && this.nextSection !== false) {
			this.activeSectionId = Math.min(this.sections.length - 1, this.activeSectionId + 1);
		} else if (direction < 0 && this.previousSection !== false) {
			this.activeSectionId = Math.max(0, this.activeSectionId - 1);
		}
		this.switchingSection(this.activeSectionId, direction);
	}

	switchingSection(idSection = this.activeSectionId, direction) {
		this.activeSectionId = idSection;
		this.stopEvent = true;
		if (((this.previousSectionId === false) && direction < 0) || ((this.nextSectionId === false) && direction > 0)) {
			this.stopEvent = false;
		}
		if (this.stopEvent) {
			document.documentElement.classList.add(this.options.wrapperAnimatedClass);
			this.wrapper.classList.add(this.options.wrapperAnimatedClass);
			this.removeClasses();
			this.setClasses();
			this.setStyle();
			if (this.options.bullets) this.setActiveBullet(this.activeSectionId);

			let delaySection;
			if (direction < 0) {
				delaySection = this.activeSection.dataset.fpDirectionUp ? parseInt(this.activeSection.dataset.fpDirectionUp) : 500;
				document.documentElement.classList.add('fp-up');
				document.documentElement.classList.remove('fp-down');
			} else {
				delaySection = this.activeSection.dataset.fpDirectionDown ? parseInt(this.activeSection.dataset.fpDirectionDown) : 500;
				document.documentElement.classList.remove('fp-up');
				document.documentElement.classList.add('fp-down');
			}

			setTimeout(() => {
				this.transitionend();
			}, delaySection);

			this.options.onSwitching(this);
			document.dispatchEvent(new CustomEvent("fpswitching", {
				detail: { fp: this }
			}));
		}
	}

	setBullets() {
		this.bulletsWrapper = document.querySelector(`.${this.options.bulletsClass}`);
		if (!this.bulletsWrapper) {
			const bullets = document.createElement('div');
			bullets.classList.add(this.options.bulletsClass);
			this.wrapper.append(bullets);
			this.bulletsWrapper = bullets;
		}
		if (this.bulletsWrapper) {
			for (let index = 0; index < this.sections.length; index++) {
				const span = document.createElement('span');
				span.classList.add(this.options.bulletClass);
				this.bulletsWrapper.append(span);
			}
		}
	}

	setZIndex() {
		let zIndex = this.sections.length;
		this.sections.forEach(section => {
			section.style.zIndex = zIndex--;
		});
	}

	removeZIndex() {
		this.sections.forEach(section => {
			section.style.zIndex = '';
		});
	}
}

if (document.querySelector('[data-fp]')) {
	flsModules.fullpage = new FullPage(document.querySelector('[data-fp]'), '');
}

function setScrollType(wrapper, pageSlider) {
	if (wrapper.classList.contains('_free')) {
		wrapper.classList.remove('_free');
		pageSlider.params.freeMode = false;
	}
	pageSlider.slides.forEach(pageSlide => {
		const pageSlideContent = pageSlide.querySelector('.screen-content');
		if (pageSlideContent) {
			const pageSlideContentHeight = pageSlideContent.offsetHeight;
			if (pageSlideContentHeight > window.innerHeight) {
				wrapper.classList.add('_free');
				pageSlider.params.freeMode = true;
			}
		}
	});
}
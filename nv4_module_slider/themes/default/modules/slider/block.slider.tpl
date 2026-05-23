<!-- BEGIN: main -->
<style>
	:root {
		--do: #c0392b;
		--do-dam: #8e1c12;
		--vang: #d4a017;
		--vang-nhat: #f5e6c0;
		--xanh-la: #2e7d32;
		--trang: #fdfaf4;
		--xam-nhat: #f7f3ec;
		--xam: #6b6b6b;
		--den: #1a1a1a;
		--bong: 0 4px 24px rgba(0, 0, 0, 0.10);
	}

	/* ── HERO SLIDER ── */
	.hero-slider {
		position: relative;
		min-height: 550px;
		overflow: hidden;
	}

	.slides-track {
		display: block;
		height: 100%;
		min-height: 550px;
		position: relative;
	}

	.slide {
		min-width: 100%;
		min-height: 550px;
		position: relative;
		display: flex;
		align-items: center;
		overflow: hidden;
		opacity: 0;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transition: opacity 0.6s ease-in-out;
	}

	.slide.is-active {
		opacity: 1;
		position: relative;
	}

	.slide-pattern {
		position: absolute;
		inset: 0;
		opacity: 0.07;
		background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
		background-size: 80px 80px;
	}

	/* Prev / Next arrows */
	.slider-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
		background: rgba(255, 255, 255, 0.15);
		border: 2px solid rgba(255, 255, 255, 0.35);
		color: #fff;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		cursor: pointer;
		backdrop-filter: blur(6px);
		transition: background 0.2s, border-color 0.2s, transform 0.2s;
	}

	.slider-arrow:hover {
		background: rgba(255, 255, 255, 0.28);
		border-color: #fff;
		transform: translateY(-50%) scale(1.08);
	}

	.slider-arrow.prev {
		left: 24px;
	}

	.slider-arrow.next {
		right: 24px;
	}

	/* Dot indicators */
	.slider-dots {
		position: absolute;
		bottom: 28px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 10px;
		z-index: 10;
	}

	.slider-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.4);
		border: 2px solid rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: all 0.3s;
	}

	.slider-dot.active {
		background: var(--vang);
		border-color: var(--vang);
		width: 28px;
		border-radius: 5px;
	}

	/* Progress bar */
	.slider-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 4px;
		background: var(--vang);
		z-index: 10;
		width: 0%;
		transition: width linear;
	}

	/* Slide counter */
	.slider-counter {
		position: absolute;
		bottom: 22px;
		right: 80px;
		color: rgba(255, 255, 255, 0.65);
		font-size: 1.2rem;
		z-index: 10;
		font-weight: 600;
		letter-spacing: 1px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.slider-arrow {
			width: 38px;
			height: 38px;
			font-size: 0.82rem;
		}

		.slider-arrow.prev {
			left: 10px;
		}

		.slider-arrow.next {
			right: 10px;
		}

		.slider-counter {
			display: none;
		}
	}
</style>
<!-- HERO SLIDER -->
<div class="hero-slider" data-slider="hero">

	<!-- Slides -->
	<div class="slides-track">

		<!-- is-active -->
		<!-- BEGIN: loop_top -->
		<div class="slide slide-{ROW.index} {ROW.active}"
			style="background-image: url('{ROW.image}'); background-size: cover; background-position: center;">
			<div class="slide-pattern"></div>

		</div>
		<!-- END: loop_top -->
	</div><!-- /slides-track -->

	<!-- Arrows -->
	<button class="slider-arrow prev" data-action="prev" aria-label="Slide trước"><i
			class="fa fa-chevron-left"></i></button>
	<button class="slider-arrow next" data-action="next" aria-label="Slide tiếp theo"><i
			class="fa fa-chevron-right"></i></button>

	<!-- Dots -->
	<div class="slider-dots">
		<!-- BEGIN: loop_dots -->
		<div class="slider-dot {DOT.DOT_ACTIVE}" data-index="{DOT.DOT_INDEX}"></div>
		<!-- END: loop_dots -->
	</div>

	<!-- Counter -->
	<div class="slider-counter"><span class="counter-current">01</span> / <span class="counter-total">04</span></div>

	<!-- Progress bar -->
	<div class="slider-progress"></div>

</div><!-- /hero-slider -->

<script>
	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('.hero-slider').forEach(sliderContainer => {
			const DURATION = 5500;
			const slides = sliderContainer.querySelectorAll('.slide');
			const dots = sliderContainer.querySelectorAll('.slider-dot');
			const counterCurrent = sliderContainer.querySelector('.counter-current');
			const counterTotal = sliderContainer.querySelector('.counter-total');
			const progress = sliderContainer.querySelector('.slider-progress');
			const arrows = sliderContainer.querySelectorAll('[data-action]');
			let current = 0;
			let timer, progStart, progElapsed = 0;
			const total = slides.length;

			if (total === 0) return;

			function pad(n) { return String(n + 1).padStart(2, '0'); }

			function goTo(idx, fromUser) {
				slides[current].classList.remove('is-active');
				dots[current].classList.remove('active');
				current = (idx + total) % total;
				slides[current].classList.add('is-active');
				dots[current].classList.add('active');
				counterCurrent.textContent = pad(current);
				counterTotal.textContent = pad(total - 1);
				if (fromUser) resetProgress();
			}

			function resetProgress() {
				clearTimeout(timer);
				progress.style.transition = 'none';
				progress.style.width = '0%';
				progElapsed = 0;
				void progress.offsetWidth;
				startProgress();
			}

			function startProgress() {
				progStart = performance.now();
				progress.style.transition = `width ${DURATION - progElapsed}ms linear`;
				progress.style.width = '100%';
				timer = setTimeout(() => {
					goTo(current + 1, false);
					resetProgress();
				}, DURATION - progElapsed);
			}

			// Arrow click handlers
			arrows.forEach(arrow => {
				arrow.addEventListener('click', () => {
					const dir = arrow.dataset.action === 'next' ? 1 : -1;
					goTo(current + dir, true);
				});
			});

			// Dot click handlers
			dots.forEach((dot, idx) => {
				dot.addEventListener('click', () => goTo(idx, true));
			});

			// Pause on hover
			sliderContainer.addEventListener('mouseenter', () => {
				progElapsed = performance.now() - progStart;
				clearTimeout(timer);
				progress.style.transition = 'none';
				progress.style.width = ((progElapsed / DURATION) * 100) + '%';
			});
			sliderContainer.addEventListener('mouseleave', () => { startProgress(); });

			// Swipe support
			let touchX = 0;
			sliderContainer.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
			sliderContainer.addEventListener('touchend', e => {
				const diff = touchX - e.changedTouches[0].clientX;
				if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1), true);
			});

			goTo(0, false);
			resetProgress();
		});
	});
</script>
<!-- END: main -->
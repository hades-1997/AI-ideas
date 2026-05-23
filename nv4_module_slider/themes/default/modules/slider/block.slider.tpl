<!-- BEGIN: main -->
<style>:root{--do:#c0392b;--do-dam:#8e1c12;--vang:#d4a017;--vang-nhat:#f5e6c0;--xanh-la:#2e7d32;--trang:#fdfaf4;--xam-nhat:#f7f3ec;--xam:#6b6b6b;--den:#1a1a1a;--bong:0 4px 24px rgba(0,0,0,.1)}.hero-slider{position:relative;min-height:550px;overflow:hidden}.slides-track{display:block;height:100%;min-height:550px;position:relative}.slide{min-width:100%;min-height:550px;position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;overflow:hidden;opacity:0;transition:opacity .6s ease-in-out}.slide.is-active{opacity:1;position:relative}.slide-pattern{position:absolute;inset:0;opacity:.07;background-image:url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");background-size:80px 80px}.slider-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:10;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.35);color:#fff;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;cursor:pointer;backdrop-filter:blur(6px);transition:background .2s,border-color .2s,transform .2s}.slider-arrow:hover{background:rgba(255,255,255,.28);border-color:#fff;transform:translateY(-50%) scale(1.08)}.slider-arrow.prev{left:24px}.slider-arrow.next{right:24px}.slider-dots{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;gap:10px;z-index:10}.slider-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.4);border:2px solid rgba(255,255,255,.5);cursor:pointer;transition:all .3s}.slider-dot.active{background:var(--vang);border-color:var(--vang);width:28px;border-radius:5px}.slider-progress{position:absolute;bottom:0;left:0;height:4px;background:var(--vang);z-index:10;width:0%;transition:width linear}.slider-counter{position:absolute;bottom:22px;right:80px;color:rgba(255,255,255,.65);font-size:1.2rem;z-index:10;font-weight:600;letter-spacing:1px}@media(max-width:768px){.slider-arrow{width:38px;height:38px;font-size:.82rem}.slider-arrow.prev{left:10px}.slider-arrow.next{right:10px}.slider-counter{display:none}}</style>
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

<script>document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.hero-slider').forEach(e=>{const t=5500,l=e.querySelectorAll('.slide'),o=e.querySelectorAll('.slider-dot'),r=e.querySelector('.counter-current'),s=e.querySelector('.counter-total'),a=e.querySelector('.slider-progress'),i=e.querySelectorAll('[data-action]');let c=0,n,u,d=0;const h=l.length;function p(e){return String(e+1).padStart(2,'0')}function g(e,t){l[c].classList.remove('is-active'),o[c].classList.remove('active'),c=(e+h)%h,l[c].classList.add('is-active'),o[c].classList.add('active'),r.textContent=p(c),s.textContent=p(h-1),t&&function(){clearTimeout(n),a.style.transition='none',a.style.width='0%',d=0,void a.offsetWidth,function(){u=performance.now(),a.style.transition=`width ${t-d}ms linear`,a.style.width='100%',n=setTimeout(()=>{g(c+1,!1),function(){clearTimeout(n),a.style.transition='none',a.style.width='0%',d=0,void a.offsetWidth,function(){u=performance.now(),a.style.transition=`width ${t-d}ms linear`,a.style.width='100%',n=setTimeout(()=>{g(c+1,!1),arguments.callee()},t-d)}()}()},t-d)}()}()}if(h>0){i.forEach(t=>{t.addEventListener('click',()=>{const e='next'===t.dataset.action?1:-1;g(c+e,!0)})}),o.forEach((t,e)=>{t.addEventListener('click',()=>g(e,!0))}),e.addEventListener('mouseenter',()=>{d=performance.now()-u,clearTimeout(n),a.style.transition='none',a.style.width=100*(d/t)+'%'}),e.addEventListener('mouseleave',()=>{u=performance.now(),a.style.transition=`width ${t-d}ms linear`,a.style.width='100%',n=setTimeout(()=>{g(c+1,!1),arguments.callee()},t-d)});let t=0;e.addEventListener('touchstart',e=>{t=e.touches[0].clientX},{passive:!0}),e.addEventListener('touchend',e=>{Math.abs(t-e.changedTouches[0].clientX)>50&&g(c+(t-e.changedTouches[0].clientX>0?1:-1),!0)}),g(0,!1),function(){clearTimeout(n),a.style.transition='none',a.style.width='0%',d=0,void a.offsetWidth,function(){u=performance.now(),a.style.transition=`width ${t-d}ms linear`,a.style.width='100%',n=setTimeout(()=>{g(c+1,!1),arguments.callee()},t-d)}()}()}})});</script>
<!-- END: main -->
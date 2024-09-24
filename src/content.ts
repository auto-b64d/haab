const observe = (
	target: Node,
	callback: (mutations: MutationRecord[], observer: MutationObserver) => void,
) => {
	new MutationObserver(callback).observe(target, { childList: true })
}

// 편의성을 위해 Node 대신 HTMLElement를 사용
const forEachAdded = (fn: (node: HTMLElement, observer: MutationObserver) => void) =>
	(muts: MutationRecord[], observer: MutationObserver) => {
		for (const mut of muts) {
			for (const node of mut.addedNodes) fn(node as HTMLElement, observer)
		}
	}

const work = forEachAdded(e => {
	// unsafe = 코드를 작성한 시점엔 의도한 대로 동작하나 미래에 부작용이 생길 수 있음
	
	let shouldRemove = false
	if (e instanceof HTMLScriptElement) {
		if (e.async && !e.src.includes('hitomi.la')) {
			// unsafe / async 속성이 적용된 script는 gg.js(다운로드 관련) 제외 광고 관련밖에 없음
			shouldRemove = true
		} else if (!e.hasAttribute('src') && !document.head.contains(e)) {
			// unsafe / body 내에 있는 인라인 스크립트는 광고 관련밖에 없음
			shouldRemove = true
		}
	} else if (e instanceof HTMLIFrameElement) {
		e.sandbox.value = '' // 스크립트 실행 비활성화
		shouldRemove = true
	} else if (e instanceof HTMLDivElement && !e.hasAttributes()) {
		// unsafe / 현재 아무 속성이 없는 div는 광고 컨테이너밖에 없음
		shouldRemove = true
	}
	
	if (!shouldRemove) return
	
	console.log(['DEBUG'], 'removing', e, '|', 'parent:', e.parentElement)
	e.remove()
})

const observeUntilFound = (
	target: Node,
	filter: (elem: HTMLElement) => boolean,
	callback: (elem: HTMLElement) => void,
) => {
	observe(target, forEachAdded((n, o) => {
		if (filter(n)) {
			o.disconnect()
			callback(n)
		}
	}))
}
const hasClass = (class_: string) =>
	(elem: Element) =>
		elem.classList.contains(class_)

// head, body도 초기에는 존재하지 않을 수 있음
observeUntilFound(
	document.documentElement,
	elem => elem instanceof HTMLHeadElement,
	head => observe(head, work)
)
observeUntilFound(
	document.documentElement,
	// 화면에 보이지 않는(visibility: hidden), 곧 교체될 body가 일시적으로 존재할 수 있음 (???)
	// 그 body가 아니라 최종적으로 쓰이는 body를 얻기 위해 부모 존재 여부로 구분
	elem => elem instanceof HTMLBodyElement && elem.parentElement != null,
	body => {
		observe(body, work)
		observeUntilFound(
			body,
			hasClass('container'),
			container => {
				observe(container, work)
				observeUntilFound(container, hasClass('top-content'), elem => observe(elem, work))
			},
		)
	}
)

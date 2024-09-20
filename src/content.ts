const observe = (
	target: Node,
	options: MutationObserverInit,
	callback: (mutations: MutationRecord[]) => void,
	once = false,
) => {
	new MutationObserver((muts, observer) => {
		callback(muts)
		if (once) observer.disconnect()
	}).observe(target, { childList: true, subtree: true, ...options })
}

// unsafe = 코드를 작성한 시점엔 의도한 대로 동작하나 미래에 부작용이 생길 수 있음

observe(document.documentElement, {}, muts => {
	for (const mut of muts) {
		for (const n of mut.addedNodes) {
			const elem = n as Element
			if (
				elem instanceof HTMLScriptElement
					&& elem.async // unsafe / 현재 async 속성이 적용된 script는 광고 관련밖에 없음
			) {
				// 광고 스크립트
				console.log(['DEBUG'], 'removing', elem)
				elem.remove()
			} else if (elem instanceof HTMLIFrameElement) {
				console.log(['DEBUG'], 'removing', elem)
				elem.sandbox.value = '' // 스크립트 실행 비활성화
				elem.remove()
			} else if (
				elem instanceof HTMLDivElement && !elem.hasAttributes() // unsafe / 현재 아무 속성이 없는 div는 광고 컨테이너밖에 없음
			) {
				// 광고 컨테이너 
				console.log(['DEBUG'], 'removing', elem)
				elem.remove()
			}
		}
	}
})

onmessage = null
for (const evt of ['load', 'DOMContentLoaded']) {
	window.addEventListener(evt, () => onmessage = null)
}

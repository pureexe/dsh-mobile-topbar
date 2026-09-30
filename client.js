/**
 * dsh-mobile-topbar
 *
 * On mobile devices (<= 768px), the sidebar no longer reserves any grid
 * column space and becomes an off-canvas drawer. In its place, a persistent
 * top bar is added: a hamburger button (left) that opens the drawer, the
 * real DeepSeek Harness brand mark + wordmark next to it (the same SVGs the
 * sidebar itself renders), and a new-session button (right, the sidebar's
 * own new-chat icon). Tapping outside the open drawer (or the hamburger
 * again) closes it. The right-hand preview/panel is not left inside its
 * (zero-width on mobile) grid column: it becomes a full-width fixed sheet
 * below the top bar, opened by the conversation's own expand control and
 * closed by its own collapse button or by the hamburger. On wider screens,
 * behavior is untouched.
 */

window.__ModuleLoader__.load({
	id: "dsh-mobile-topbar",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const react = require("react");
		const react_dom = require("react-dom");
		const primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		const h = react.createElement;

		const TOPBAR_HEIGHT = 52;

		// ── CSS injection ────────────────────────────────────────────────
		const css = `
/* ===== Mobile top bar + off-canvas sidebar drawer ===== */
@media (max-width: 768px) {
	/* The sidebar never reserves grid space on mobile; it becomes a drawer.
	   The right column is pinned to 0px as well -- the right panel escapes
	   it as a fixed sheet (below), so neither side steals horizontal space
	   from the conversation on a narrow screen. The frame gains top padding
	   to make room for our fixed top bar. */
	.pI_x6G_frame {
		grid-template-columns: 0px minmax(0, 1fr) 0px !important;
		padding-top: ${TOPBAR_HEIGHT}px !important;
		box-sizing: border-box !important;
	}
	.pI_x6G_frame .pI_x6G_handle {
		display: none !important;
	}

	/* The sidebar becomes a fixed drawer below the top bar, slid via \`left\`
	   (never \`transform\`, which would reparent fixed descendants to it as a
	   containing block). */
	.hHd-Xa_root {
		position: fixed !important;
		top: ${TOPBAR_HEIGHT}px !important;
		left: 0 !important;
		height: calc(100% - ${TOPBAR_HEIGHT}px) !important;
		width: min(85vw, 300px) !important;
		max-width: min(85vw, 300px) !important;
		min-width: 0 !important;
		z-index: 900 !important;
		box-shadow: 2px 0 24px rgba(0, 0, 0, .25) !important;
		transition: left .22s ease !important;
	}
	.hHd-Xa_root.hHd-Xa_collapsed {
		left: -100vw !important;
		box-shadow: none !important;
	}

	/* The sidebar's own logo row (brand mark + wordmark, and the collapse
	   toggle) duplicates the top bar, which is always on screen here. Hide
	   it to save space instead of showing the same logo and a second way to
	   collapse the sidebar. */
	.hHd-Xa_root .hHd-Xa_logoRow {
		display: none !important;
	}
	/* Without the logo row, the new-session button sits flush against the
	   drawer's top edge; give it a little breathing room. */
	.hHd-Xa_root .hHd-Xa_newSession {
		margin-top: 12px !important;
	}

	/* Backdrop behind the open drawer, below the top bar; tapping it closes
	   the sidebar again. */
	.my-dsh-sidebar-backdrop {
		position: fixed;
		top: ${TOPBAR_HEIGHT}px;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 890;
		background: rgba(0, 0, 0, .35);
		opacity: 0;
		pointer-events: none;
		transition: opacity .2s ease;
	}
	.my-dsh-sidebar-backdrop.is-open {
		opacity: 1;
		pointer-events: auto;
	}

	/* The right panel (file/document preview) is an absolutely-positioned
	   child of the frame's right column, which is 0px wide on mobile. Its
	   React-set inline width follows the seat's auto-fullscreen rule
	   (100vw when the viewport reads < 768px, the computed column width
	   otherwise) -- so whenever that rule does not fire on a narrow device
	   (a stale viewport width, a rotated or zoomed page, a 769px-plus
	   window whose column collapsed), the panel is a zero-width sliver at
	   the right edge while the corner expand button has already unmounted
	   itself: nothing appears, no error is thrown -- "the button just goes
	   away". Force a fixed full-width sheet below the top bar instead:
	   fixed positioning ignores the 0px column, and !important overrides the
	   inline width (and the Windows-titlebar max-width) in every state.
	   While collapsed, the core CSS keeps the panel's children
	   visibility:hidden and the panel itself pointer-events:none, so the
	   closed sheet is invisible and inert. It stays under the top bar in
	   stacking order so the bar stays reachable while it's open. */
	.P3OORG_panel {
		position: fixed !important;
		top: ${TOPBAR_HEIGHT}px !important;
		left: 0 !important;
		right: 0 !important;
		bottom: 0 !important;
		width: auto !important;
		max-width: none !important;
		z-index: 950 !important;
	}

	/* The Settings modal centers its panel in the full viewport (inset:0), so
	   on a short mobile screen its panel's top edge lands underneath our top
	   bar. Shrink the overlay to start below the bar -- its flex centering
	   then re-centers the panel inside the remaining space -- and cap the
	   panel's own height so it can't still overflow past the bar. */
	.VOzbGW_overlay {
		top: ${TOPBAR_HEIGHT}px !important;
	}
	.VOzbGW_panel {
		height: min(800px, calc(100vh - ${TOPBAR_HEIGHT}px - 32px)) !important;
		max-height: calc(100vh - ${TOPBAR_HEIGHT}px - 16px) !important;
	}

	/* The persistent top bar: hamburger, brand mark, new-session. Always on
	   top so the hamburger stays reachable even while the drawer is open. */
	.my-dsh-mobile-topbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: ${TOPBAR_HEIGHT}px;
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0 6px;
		background: var(--dsw-specific-sidebar-fill);
		border-bottom: 1px solid var(--dsw-alias-border-l1);
		color: var(--dsw-alias-label-primary);
	}
	.my-dsh-topbar-btn {
		flex: none;
		width: 38px;
		height: 38px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: 8px;
		color: inherit;
		cursor: pointer;
		padding: 0;
	}
	.my-dsh-topbar-btn:active {
		background: var(--dsw-alias-bg-layer-2);
	}
	.my-dsh-topbar-brand {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 4px;
		font-size: 15px;
		font-weight: 600;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.my-dsh-topbar-brand > svg {
		flex: none;
	}
	.my-dsh-topbar-wordmark {
		display: flex;
		align-items: center;
		min-width: 0;
	}
	.my-dsh-topbar-wordmark svg {
		display: block;
		height: 16px;
		width: auto;
	}
}

/* On wider screens, keep original behavior; never show mobile-only chrome. */
@media (min-width: 769px) {
	.my-dsh-mobile-topbar,
	.my-dsh-sidebar-backdrop {
		display: none !important;
	}
}
`;

		const tagId = "dsh-mobile-topbar/SidebarRail.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-mobile-topbar";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		//#endregion

		const inject = ["layout", "uiWorkspace"];

		function MenuIcon() {
			return h("svg", { width: 20, height: 20, viewBox: "0 0 20 20", "aria-hidden": "true" },
				h("path", { d: "M3 5.5h14M3 10h14M3 14.5h14", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" }));
		}

		// The new-chat icon's export name changed across dsh generations:
		// 0.1.5/0.1.6 primitives export `IconNewChatOutline16`, while 0.1.7
		// renamed it to `IconNewChatOutlineRegular` / `IconNewChatOutlineMedium`
		// (all take a `size` prop, not width/height). Try each generation's
		// name in turn so the button shows the real icon on either, and a
		// future rename degrades to the fish logo instead of throwing
		// "Element type is invalid" inside React.
		const NewChatIcon = primitives.IconNewChatOutline16
			?? primitives.IconNewChatOutlineRegular
			?? primitives.IconNewChatOutlineMedium
			?? primitives.IconNewChatOutline
			?? primitives.FishLogo;

		function TopBar({ onToggleSidebar, onNewSession }) {
			return h("div", { className: "my-dsh-mobile-topbar" },
				h("button", {
					type: "button",
					className: "my-dsh-topbar-btn",
					"aria-label": "Open sidebar",
					onClick: onToggleSidebar,
				}, h(MenuIcon)),
				h("div", { className: "my-dsh-topbar-brand" },
					h(primitives.FishLogo, { size: 20 }),
					h("span", { className: "my-dsh-topbar-wordmark" },
						h(primitives.BrandWordmark, { includeMark: false }))),
				h("button", {
					type: "button",
					className: "my-dsh-topbar-btn",
					"aria-label": "New session",
					onClick: onNewSession,
				}, h(NewChatIcon, { size: 20 })));
		}

		/**
		 * Client-side apply: mounts the persistent mobile top bar and a backdrop
		 * behind the drawer. All structural/positioning work is CSS-only (above);
		 * this wires the two live actions (toggle sidebar, start a new session)
		 * and keeps the backdrop's visibility in sync with the drawer's own
		 * open/closed class.
		 */
		function apply(ctx) {
			ctx.effect(() => {
				const container = document.createElement("div");
				container.id = "dsh-mobile-topbar-root";
				document.body.appendChild(container);
				const root = react_dom.createRoot(container);
				root.render(h(TopBar, {
					onToggleSidebar: () => {
						// The right panel is a fixed sheet *above* the left drawer's
						// z-index, so opening the drawer while the panel is up would
						// leave it covering the drawer. Collapse the panel through
						// its own action first: the seat re-opens the panel from the
						// store's expanded flag whenever the layout flags reset, so
						// layout.closeRightbar() alone would let it come straight
						// back. If the service isn't there (older host), click the
						// panel's own collapse button directly.
						let closed = false;
						try {
							const sidebarRight = ctx.get("sidebarRight");
							if (sidebarRight && typeof sidebarRight.isExpanded === "function" && sidebarRight.isExpanded()) {
								sidebarRight.toggleExpanded();
								closed = true;
							}
						} catch (_err) {
							// No mounted session surface: fall through to the DOM path.
						}
						if (!closed) {
							const toggle = document.querySelector(".P3OORG_panel[data-sidebar-right-open] [data-sidebar-right-toggle]");
							if (toggle) toggle.click();
						}
						const layout = ctx.get("layout");
						layout.closeRightbar();
						layout.toggleSidebar();
					},
					onNewSession: () => ctx.get("uiWorkspace").startSession(),
				}));

				return () => {
					root.unmount();
					container.remove();
				};
			}, "mobile-topbar: topbar");

			ctx.effect(() => {
				const backdrop = document.createElement("div");
				backdrop.className = "my-dsh-sidebar-backdrop";
				backdrop.addEventListener("click", () => {
					ctx.get("layout").toggleSidebar();
				});
				document.body.appendChild(backdrop);

				const sync = () => {
					const sidebarRoot = document.querySelector(".hHd-Xa_root");
					const isMobile = window.matchMedia("(max-width: 768px)").matches;
					const isOpen = sidebarRoot !== null && !sidebarRoot.classList.contains("hHd-Xa_collapsed");
					backdrop.classList.toggle("is-open", isMobile && isOpen);
				};

				sync();
				const observer = new MutationObserver(sync);
				observer.observe(document.body, { attributes: true, attributeFilter: ["class"], subtree: true });
				window.addEventListener("resize", sync);

				return () => {
					window.removeEventListener("resize", sync);
					observer.disconnect();
					backdrop.remove();
				};
			}, "mobile-topbar: backdrop");
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

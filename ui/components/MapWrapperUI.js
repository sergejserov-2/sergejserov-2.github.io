initResize() {
    const handle =
        this.element?.parentElement?.querySelector(".resize-handle");

    if (!handle) return;

    let startX, startY, startW, startH;
    let wrapper;
    let isDragging = false;

    let canvas;

    handle.addEventListener("mousedown", (e) => {
        e.preventDefault();

        isDragging = true;

        wrapper = this.element.parentElement;
        const rect = wrapper.getBoundingClientRect();

        startX = e.clientX;
        startY = e.clientY;
        startW = rect.width;
        startH = rect.height;

        document.body.style.userSelect = "none";

        canvas = this.map?.getCanvas?.();

        // =========================
        // 🔥 FREEZE (важно: не visibility)
        // =========================
        if (canvas) {
            canvas.style.pointerEvents = "none";
            canvas.style.willChange = "auto";
        }

        wrapper.classList.add("map-resizing");

        let raf = null;

        const onMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            wrapper.style.width = Math.max(200, startW + dx) + "px";
            wrapper.style.height = Math.max(200, startH - dy) + "px";

            // 🔥 throttle resize (не каждый mousemove)
            if (!raf) {
                raf = requestAnimationFrame(() => {
                    this.map?.resize?.();
                    raf = null;
                });
            }
        };

        const onUp = () => {
            isDragging = false;

            document.body.style.userSelect = "";

            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);

            wrapper.classList.remove("map-resizing");

            // =========================
            // 🔥 FINAL STABILIZATION
            // =========================
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.map?.resize?.();
                    this.map?.triggerRepaint?.();

                    if (canvas) {
                        canvas.style.pointerEvents = "";
                        canvas.style.willChange = "transform";
                    }
                });
            });
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    });
}

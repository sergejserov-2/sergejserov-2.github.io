-handle");

        if (!handle) return;

        let startX, startY, startW, startH;
        let wrapper;
        let rafResize = null;
        let isDragging = false;

        const resizeMapOnce = () => {
            if (rafResize) return;

            rafResize = requestAnimationFrame(() => {
                this.map?.resize?.();
                rafResize = null;
            });
        };

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

            handle.setPointerCapture?.(e.pointerId);

            const onMove = (e) => {
                if (!isDragging) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                wrapper.style.width = Math.max(200, startW + dx) + "px";
                wrapper.style.height = Math.max(200, startH - dy) + "px";

                resizeMapOnce();
            };

            const onUp = () => {
                isDragging = false;

                document.body.style.userSelect = "";

                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.map?.resize?.();
                    });
                });
            };

            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
        });
    }
}

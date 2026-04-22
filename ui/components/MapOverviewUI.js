const p = ease(Math.min((timestamp - startTime) / duration, 1));

      const bounds = new google.maps.LatLngBounds(
        {
          lat: sw0.lat() + (sw1.lat() - sw0.lat()) * p,
          lng: sw0.lng() + (sw1.lng() - sw0.lng()) * p
        },
        {
          lat: ne0.lat() + (ne1.lat() - ne0.lat()) * p,
          lng: ne0.lng() + (ne1.lng() - ne0.lng()) * p
        }
      );

      map.fitBounds(bounds, 0);

      if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  // =========================
  // CLEAR
  // =========================
  clear() {
    this.markers.forEach(m => this.adapter.removeMarker(m));
    this.lines.forEach(l => l.setMap(null));

    this.markers = [];
    this.lines = [];
  }

  // =========================
  // RESIZE
  // =========================
  scheduleResize() {
    if (!this.map) return;

    if (this._resizeRAF) {
      cancelAnimationFrame(this._resizeRAF);
    }

    this._resizeRAF = requestAnimationFrame(() => {
      google.maps.event.trigger(this.map, "resize");
      this._resizeRAF = null;
    });
  }

  forceResize() {
    this.scheduleResize();
  }

  // =========================
  // DESTROY
  // =========================
  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }
}

(() => {
    document.querySelectorAll('[data-copy-target]').forEach(button => {
        const source = document.getElementById(button.dataset.copyTarget);
        const status = button.closest('.contact-card')?.querySelector('.copy-status');
        if (!source || !status) return;

        button.hidden = false;
        button.addEventListener('click', async () => {
            button.disabled = true;
            status.textContent = '';
            delete status.dataset.state;

            try {
                if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
                await navigator.clipboard.writeText(source.textContent.trim());
                status.textContent = `已复制${button.dataset.copyLabel}。`;
                status.dataset.state = 'success';
            } catch {
                status.textContent = '未能复制，请选中上方号码手动复制。';
                status.dataset.state = 'error';
            } finally {
                button.disabled = false;
            }
        });
    });
})();

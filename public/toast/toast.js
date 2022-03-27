const Toast = {
    init() {
        this.hideTimeout = null;

        this.el = document.createElement('div');
        this.el.className = 'toast';
        document.body.appendChild(this.el);
    }, 

    show(message, state) {
        clearTimeout(this.hideTimeout);

        if (state == 'success'){
            this.el.textContent = message;
            this.el.className = 'toast toast--visibile toast--success';
        }

        else {
            if (message == 'auth/invalid-email')
                message = 'Please enter a valid email';
            if (message == 'auth/weak-password')
                message = 'Password must be at least six characters';
            this.el.textContent = message;
            this.el.className = 'toast toast--visibile toast--error';
        }

        if (state) {
            this.el.classList.add(`toast--${state}`);
        }

        this.hideTimeout = setTimeout(() => {
            this.el.classList.remove('toast--visibile');
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => Toast.init());
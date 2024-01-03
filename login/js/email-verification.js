import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { firebaseConfig } from '../../data/js/config.js';

(async function() {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    userLocale.onData.load();
    let lang;

    const container = document.querySelector(`.container`);

    const langCheker = async() => {
        let getLang;
        await fetch('../data/js/language.json').then((data) => data.json()).then((res) => {
            getLang = res;
        });

        let currentLang;
        if(userLocale.state.last_lang == 'indonesia') {
            currentLang = 'indonesia'
        } else {
            currentLang = 'english';
        }
        
        lang = getLang[currentLang].Login.Email;
    }
    await langCheker();

    if (isSignInWithEmailLink(auth, window.location.href)) {
        container.innerHTML = `${lang.setting_up}...`
        let email = window.localStorage.getItem('kiriminEmailSignIn');
        if (!email) {
            popup.prompt({
                msg: lang.enter_email,
                onyes: (res) => {
                    signInWithEmailLink(auth, res, window.location.href)
                    .then(() => {
                        container.innerHTML = lang.your_account;
                    })
                    .catch((error) => {
                        popup.confirm({
                            msg: error,
                            onno: () => window.location.reload(),
                            onyes: () => window.location.href = `${window.location.origin}/login/`,
                            yes: lang.exit,
                            no: lang.try_again,
                            type: 'normal'
                        });
                    });
                },
                type: "info",
            });
        } else {
            signInWithEmailLink(auth, email, window.location.href)
            .then(() => {
                container.innerHTML = lang.your_account;
                let lsEmail = window.localStorage.getItem('kiriminEmailSignIn');
                if(lsEmail) window.localStorage.removeItem('kiriminEmailSignIn');
            })
            .catch((error) => {
                popup.alert({
                    msg: error,
                    onno: () => window.location.reload(),
                    onyes: () => window.location.href = `${window.location.origin}/login/`,
                    yes: lang.exit,
                    no: lang.try_again,
                    type: 'normal'
                });
            });
        }
    } else {
        container.innerHTML = lang.link_expired;
    }
    
})();
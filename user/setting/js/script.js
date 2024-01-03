import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getDatabase, ref, update, get } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js";
import { getStorage, ref as sref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-storage.js";
import { firebaseConfig } from '../../../data/js/config.js';
import { getID } from "../../../data/js/authState.js";

(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getDatabase(app);
    const storage = getStorage(app);
    userLocale.onData.load();
    
    let lang;

    let currentID = null;
    const container = document.querySelector('.container');

    const Setting = {
        actionBar() {
            const element = document.createElement('h1');
            element.classList.add('page-title');
            element.innerHTML = (`<button id="back-dashboard"><i class="fa-solid fa-arrow-left"></i></button>${lang.setting}`);
            container.appendChild(element);

            element.querySelector('#back-dashboard').onclick = () => window.location.href = window.location.origin + '/dashboard/';
        },
        accountSect(user) {
            const element = document.createElement('section');
            element.classList.add('account-section');
            element.setAttribute('data-setting', 'account');
            element.innerHTML = (`
                <h2>- - ${lang.account} - -</h2>
                <div class="profile-picture" data-account="profile-picture">
                    <i class="fa-regular fa-edit b-font"></i>
                </div>
                <div class="box" data-edit="username">
                    <i>${lang.username}:</i>
                    <b class="jarak" data-account="profile-username">Loading</b>
                    <p class="kecil" data-account="profile-id">Loading</p>
                    <p class="s-font c-yellow"><i>${lang.all_user}</i></p>
                    <button class="bottom" id="edit-username">
                        <i class="fa-solid fa-edit"></i>
                        ${lang.edit_username}
                    </button>
                </div>
                <div class="box" data-edit="about">
                    <i>${lang.about}:</i>
                    <p class="about-sect" data-account="profile-about">Loading</p>
                    <p class="s-font c-yellow"><i>${lang.all_user}</i></p>
                    <button class="bottom" id="edit-about">
                        <i class="fa-solid fa-edit"></i>
                        ${lang.edit_about}
                    </button>
                </div>
                <div class="box" data-edit="link">
                    <i>${lang.social}:</i>
                    <div class="group">
                        <button class="social" data-social="github"><i class="fa-brands fa-github c-white"></i> <span id="github-social">Not Linked</span></button>
                        <button class="social" data-social="youtube"><i class="fa-brands fa-youtube c-red"></i> <span id="youtube-social">Not Linked</span></button>
                        <button class="social" data-social="twitter"><i class="fa-brands fa-twitter c-blue"></i> <span id="twitter-social">Not Linked</span></button>
                    </div>
                </div>
                <div class="box">
                    <i>Email:</i>
                    <div class="secret">
                        <p id="email-real" class="disabled">${user.email}</p>
                        <p id="email-sharp">--------------------</p>
                        <i class="fa-light fa-eye" id="email-toggle"></i>
                    </div>
                    <i>Private ID:</i>
                    <div class="secret">
                        <p id="uid-real" class="disabled">${user.uid}</p>
                        <p id="uid-sharp">--------------------</p>
                        <i class="fa-light fa-eye" id="uid-toggle"></i>
                    </div>
                    <p class="s-font c-yellow"><i>${lang.only_you}</i></p>
                </div>
                <div class="br"></div>
            `);

            const emailToggle = element.querySelector(`#email-toggle`);
            emailToggle.onclick = () => {

                const email_real = element.querySelector(`#email-real`);
                const email_sharp = element.querySelector(`#email-sharp`);

                if(email_real.classList.contains('disabled')) {
                    email_real.classList.remove('disabled');
                    email_sharp.classList.add('disabled');
                    emailToggle.classList.remove('fa-eye');
                    emailToggle.classList.add('fa-eye-slash');
                } else {
                    email_sharp.classList.remove('disabled');
                    email_real.classList.add('disabled');
                    emailToggle.classList.remove('fa-eye-slash');
                    emailToggle.classList.add('fa-eye');
                }
            }
            const uidToggle = element.querySelector(`#uid-toggle`);
            uidToggle.onclick = () => {

                const uid_real = element.querySelector(`#uid-real`);
                const uid_sharp = element.querySelector(`#uid-sharp`);

                if(uid_real.classList.contains('disabled')) {
                    uid_real.classList.remove('disabled');
                    uid_sharp.classList.add('disabled');
                    uidToggle.classList.remove('fa-eye');
                    uidToggle.classList.add('fa-eye-slash');
                } else {
                    uid_sharp.classList.remove('disabled');
                    uid_real.classList.add('disabled');
                    uidToggle.classList.remove('fa-eye-slash');
                    uidToggle.classList.add('fa-eye');
                }
            }

            const profilePicture = element.querySelector(`[data-account="profile-picture"]`);
            const profileUsername = element.querySelector(`[data-account="profile-username"]`);
            const profileID = element.querySelector(`[data-account="profile-id"]`);
            const profileAbout = element.querySelector(`[data-account="profile-about"]`);

            const editUsername = element.querySelector(`#edit-username`);
            const editAbout = element.querySelector(`#edit-about`);
            
            const editLinkGithub = element.querySelector(`[data-social="github"]`);
            const linkGithub = element.querySelector(`#github-social`);

            const editLinkYoutube = element.querySelector(`[data-social="youtube"]`);
            const linkYoutube = element.querySelector(`#youtube-social`);
            
            const editLinkTwitter = element.querySelector(`[data-social="twitter"]`);
            const linkTwitter = element.querySelector(`#twitter-social`);

            editLinkGithub.onclick = () => popup.prompt({
                msg: 'GitHub Username<br>Ex: devanka761',
                max: 20,
                onyes: (res) => {
                    update(ref(db, 'users/' + currentID), {
                        github: res
                    });
                    popup.alert(`${lang.other_user} <a target="_blank" href="https://github.com/${res}">${lang.your_github}</a> Account`);
                    linkGithub.innerText = res;
                }
            });
            editLinkYoutube.onclick = () => popup.prompt({
                msg: 'Youtube ID<br>Ex: UC6DRs2WBcTosEKqLUbgu5xA',
                max: 50,
                onyes: (res) => {
                    update(ref(db, 'users/' + currentID), {
                        youtube: res
                    });
                    popup.alert(`${lang.other_user} <a target="_blank" href="https://www.youtube.com/channel/${res}">${lang.your_youtube}</a>`);
                    linkYoutube.innerText = 'Linked';
                }
            });
            editLinkTwitter.onclick = () => popup.prompt({
                msg: 'Twitter Username<br>Ex: _geraldgerald_',
                max: 20,
                onyes: (res) => {
                    update(ref(db, 'users/' + currentID), {
                        twitter: res
                    });
                    popup.alert(`${lang.other_user} <a target="_blank" href="https://twitter.com/${res}">${lang.your_twtiter}</a>`);
                    linkTwitter.innerText = res;
                }
            });
            
            profilePicture.onclick = () => editPhoto();

            get(ref(db, 'users/' + currentID)).then((data) => {
                let s = data.val();
                profilePicture.style.backgroundImage = `url(${s.pictureURL || s.photoURL})`;
                profileUsername.innerText = s.username ? `@${s.username}` : s.displayName;
                profileID.innerText = `Global ID: ${data.key}`;

                s.about ? profileAbout.innerText = s.about : profileAbout.innerHTML = `<i>${lang.hey_there}</i>`;

                s.github ? linkGithub.innerText = s.github : linkGithub.innerText = lang.not_linked;
                s.youtube ? linkYoutube.innerText = lang.linked : linkYoutube.innerText = lang.not_linked;
                s.twitter ? linkTwitter.innerText = s.twitter : linkTwitter.innerText = lang.not_linked;

                editUsername.onclick = () => popup.prompt({
                    msg: lang.new_username,
                    max: 20,
                    nowrap: true,
                    val: s.username || s.displayName,
                    placeholder: lang.who_are_you,
                    onyes: (res) => {
                        if(res.length < 4) return popup.alert(lang.failed_4);
                        if(res.length > 20) return popup.alert(lang.failed_20);
                        profileUsername.innerText = `@${res}`;
                        update(ref(db, 'users/' + currentID), {
                            username: res.replace(/ /g, '')
                        });
                    }
                });
                editAbout.onclick = () => popup.prompt({
                    msg: lang.new_about,
                    max: 100,
                    textarea: true,
                    val: s.about || '',
                    placeholder: lang.type_some,
                    onyes: (res) => {
                        if(res.length < 1) return;
                        if(res.length > 100) return popup.alert(lang.failed_100);
                        profileAbout.innerText = res;
                        update(ref(db, 'users/' + currentID), {
                            about: res,
                        });
                    }
                });
            });

            const editPhoto = () => {
                const element = document.createElement('input');
                element.setAttribute('type', 'file');
                element.setAttribute('accept', 'image/*')
                element.click();

                element.onchange = () => {

                    const ext = element.value.slice((Math.max(0, element.value.lastIndexOf(".")) || Infinity) + 1);
                    const valid = ["jpg", "jpeg", "png", "webp"];
                    const file = element.files[0];
                    const ukuran = file.size / 1053818;
                    const bulat = Math.ceil(ukuran * Math.pow(10, 2)) / Math.pow(10, 2);

                    if(!valid.includes(ext.toLowerCase())) return popup.alert(lang.failed_format);
                    if(file.size > 2102394) return popup.alert(`${lang.failed_size_1} ${bulat} ${lang.failed_size_2}`);

                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => popup.confirm({
                        msg: `${lang.continue_with}<br><img src="${reader.result}" alt="${element.value}" />`,
                        type: 'info',
                        onyes: () => {
                            uploadPhoto(file, ext);
                            element.remove();
                        },
                        onno: () => element.remove(),
                        no: lang.cancel,
                        yes: lang.ok
                    });
                }
            }
            
            const uploadPhoto = (file, ext) => {
                const path = `image/${auth.currentUser.uid}/profile.${ext}`;
                const photoUp = uploadBytesResumable(sref(storage, path), file);

                const uploadElement = document.createElement("div");
                uploadElement.classList.add("Uploader");
                uploadElement.innerHTML = (`<h1>${lang.uploading}</h1>`);

                container.appendChild(uploadElement);

                photoUp.on('state_changed', (snapshot) => {
                    let progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);

                    if(progress == 100) {
                        uploadElement.innerHTML = (`<h1>${lang.uploading}</h1><h2>100%</h2>`);
                        setTimeout(() => {
                            uploadElement.innerHTML = (`<h1>${lang.uploading}</h1><h2>${lang.processing}</h2>`);
                        }, 250);
                    } else {
                        uploadElement.innerHTML = (`<h1>${lang.uploading}</h1><h2>${progress}%</h2>`);
                    }

                }, (err) => {
                    return popup.alert(err);
                }, () => {
                    getDownloadURL(photoUp.snapshot.ref).then((imgURL) => {
                        update(ref(db, 'users/' + currentID), {
                            pictureURL: imgURL
                        });
                        profilePicture.style.backgroundImage = `url(${imgURL})`;
                        uploadElement.remove();
                    });
                });
            }
            container.appendChild(element);
        },
        optionSect(user) {
            const element = document.createElement('section');
            element.classList.add('option-section');
            element.setAttribute('data-setting', 'option');

            const updateElement = () => {
                element.innerHTML = (`
                    <h2>- - Option - -</h2>
                    <div class="box" data-edit="language">
                        <i>${lang.language}:</i>
                        <p id="language">Bahasa Indonesia</p>
                        <button class="bottom">
                            <select name="language" id="changeLang">
                                <option value="">${lang.select_lang}</option>
                                <option value="indonesia">Bahasa Indonesia</option>
                                <option value="english">English</option>
                            </select>
                        </button>
                    </div>
                    <div class="box" data-edit="theme">
                        <i>${lang.theme}:</i>
                        <p id="theme">Dark Mode</p>
                        <button class="bottom">
                            <select name="theme" id="changeTheme">
                                <option value="">${lang.select_theme}</option>
                                <option value="dark">Dark Mode</option>
                                <option value="light">Light Mode</option>
                            </select>
                        </button>
                    </div>
                    <div class="br"></div>
                `);
                const userStg = userLocale.state;
                (() => {
                    const current = element.querySelector('#language');
                    current.style.textTransform = 'capitalize';
                    if(userStg.last_lang == 'indonesia') current.innerText = 'Bahasa ' + userStg.last_lang;
                    else current.innerText = 'English';
                    const input = element.querySelector(`#changeLang`);
                    input.onchange = async () => {
                        await userLocale.action.cahngeLang(input.value);
                        await langCheker();
                        this.init(user);
                    }
                })();
                (() => {
                    const current = element.querySelector('#theme');
                    current.style.textTransform = 'capitalize';
                    if(userStg.last_theme == 'light') current.innerText = `${userStg.last_theme} Mode`;
                    else current.innerText = 'Dark Mode';
                    const input = element.querySelector('#changeTheme');
                    input.onchange = async() => {
                        if(input.value == userLocale.state.last_theme) return;
                        await userLocale.action.changeTheme(input.value);
                        changingTheme(input.value, current);
                    }

                    const changingTheme = (newTheme, current) => {
                        const theme_changing = document.createElement('div');
                        theme_changing.classList.add('Theme_Change');
                        if(newTheme == 'light') {
                            theme_changing.innerHTML = '<i class="fa-solid fa-sun"></i>';
                            document.body.appendChild(theme_changing);
                            setTimeout(() => {
                                current.innerText = newTheme+' Mode';
                                theme_changing.classList.add('out');
                                if(document.body.classList.contains('dark')) document.body.classList.remove('dark');
                            }, 1000);
                            setTimeout(() => {
                                theme_changing.remove();
                            }, 1900);
                        } else {
                            theme_changing.innerHTML = '<i class="fa-solid fa-moon"></i>';
                            theme_changing.classList.add('Theme_Change', 'dark');
                            document.body.appendChild(theme_changing);
                            setTimeout(() => {
                                current.innerText = newTheme+' Mode';
                                theme_changing.classList.add('out');
                                document.body.classList.add('dark');
                            }, 1000);
                            setTimeout(() => {
                                theme_changing.remove();
                            }, 1900);
                        }
                    }
                })();
            }

            updateElement();


            container.appendChild(element);
        },
        logoutSect() {
            const element = document.createElement('section');
            element.classList.add('logout-section');
            element.setAttribute('data-setting', 'logout');
            element.innerHTML = (`
                <h2>- - ${lang.logout} - -</h2>
                <div class="grouping">
                    <button class="logout action" id="clear-logout">${lang.clear_logout}</button>
                    <button class="logout action" id="logout">${lang.logout}</button>
                </div>
            `);

            const logout = element.querySelector('#logout');
            logout.onclick = () => popup.confirm({
                msg: lang.are_you_1,
                type: 'danger',
                onyes: () => signOut(auth).then(() => {
                    window.location.href = `${window.location.origin}/login/`;
                }),
                yes: lang.ok,
                no: lang.cancel
            });

            const clearLogout = element.querySelector('#clear-logout');
            clearLogout.onclick = () => popup.confirm({
                msg: lang.are_you_2,
                onyes: () => {
                    window.localStorage.removeItem('kirimin_user_data');
                    signOut(auth).then(() => window.location.href = `${window.location.origin}/login/`)
                }
            });

            container.appendChild(element);
        },
        init(user) {
            container.innerHTML = '';
            this.actionBar();
            this.accountSect(user);
            this.optionSect(user);
            this.logoutSect(user);
        }
    };

    const langCheker = async() => {
        let getLang;
        await fetch('../../data/js/language.json').then((data) => data.json()).then((res) => {
            getLang = res;
        });
        let currentLang;
        if(userLocale.state.last_lang == 'indonesia') {
            currentLang = 'indonesia'
        } else {
            currentLang = 'english';
        }
        lang = getLang[currentLang].User.Setting;
    }

    langCheker();
    onAuthStateChanged(auth, (user) => {
        container.innerHTML = lang.getting;
        if(user) {
            getID(user).then((res) => {
                currentID = res;
                Setting.init(user);
            });
        } else {
            window.location.href = window.location.origin + '/login/';
        }
    })

})();
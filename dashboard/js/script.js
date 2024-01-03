import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getDatabase, ref, set, remove, update, get, child, query, limitToLast } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js";
import { getStorage, ref as sref, deleteObject } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-storage.js";
import { firebaseConfig } from '../../data/js/config.js';
import { getID } from "../../data/js/authState.js";

(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getDatabase(app);
    const storage = getStorage(app);
    
    let lang;

    let currentID = null;
    const container = document.querySelector('.container');
    let prevMain = null;
    let prevFooter = null;
    let prevButton = null;

    const createElement = () => {
        const header = document.createElement('header');
        header.innerHTML = (`
            <div class="title-bar">
                <h1>Chat App || Word Chat</h1>
                <div class="buttons">
                    <button class="action" id="icon-search"><i class="fa-solid fa-search"></i></button>
                    <button class="action" id="icon-setting"><i class="fa-solid fa-gear"></i></button>
                </div>
            </div>
            <div class="menu-bar">
                <button id="changeChat"><i class="fa-duotone fa-comments"></i> ${lang.chats}</button>
                <button id="changeRandom"><i class="fa-duotone fa-shuffle"></i> ${lang.random}</button>
                <button id="changeGroup"><i class="fa-duotone fa-users"></i> ${lang.groups}</button>
                <button id="changePost"><i class="fa-duotone fa-images"></i> ${lang.posts}</button>
            </div>
        `);
        const btnChat = header.querySelector('#changeChat');
        const btnRandom = header.querySelector('#changeRandom');
        const btnGroup = header.querySelector('#changeGroup');
        const btnPost = header.querySelector('#changePost');

        const icSetting = header.querySelector('#icon-setting');
        const icSearch = header.querySelector('#icon-search');

        btnChat.onclick = () => {
            if(btnChat.getAttribute('class') == 'enabled') return;
            changePage(prevMain, prevFooter, chatPage, btnChat);
        }
        btnRandom.onclick = () => {
            if(btnRandom.getAttribute('class') == 'enabled') return;
            changePage(prevMain, prevFooter, randomPage, btnRandom);
        }
        btnGroup.onclick = () => {
            if(btnGroup.getAttribute('class') == 'enabled') return;
            changePage(prevMain, prevFooter, groupPage, btnGroup);
        }
        btnPost.onclick = () => {
            if(btnPost.getAttribute('class') == 'enabled') return;
            changePage(prevMain, prevFooter, postPage, btnPost);
        }
        
        icSetting.onclick = () => window.location.href = window.location.origin + '/user/setting/';
        icSearch.onclick = () => popup.prompt({
            msg: 'Username/User ID',
            max: '20',
            onyes: (res) => {
                if(res.length < 2) return popup.alert(lang.min_username);
                changePage(prevMain, prevFooter, searchPage, icSearch, res);
            }
        });

        container.innerHTML = '';
        container.appendChild(header);

        const lastState = userLocale.state.last_page;
        if(lastState == 'dashboard_random') {
            btnRandom.click();
        } else if(lastState == 'dashboard_groups') {
            btnGroup.click();
        } else if(lastState == 'dashboard_posts') {
            btnPost.click();
        } else {
            btnChat.click();
        }
    }

    const searchPage = (res) => {
        prevMain = document.createElement('main');
        prevMain.innerHTML = (`
            <div class="card-list"></div>
        `);

        const cardListElement = prevMain.querySelector('.card-list');
        cardListElement.innerHTML = `<div style="text-align: center;"><i>${lang.searching}</i></div>`;

        get(ref(db, 'users')).then((datas) => {
            cardListElement.innerHTML = '';
            if(datas.exists()) {
                datas.forEach((data) => {
                    let s = data.val();
                    let uname = data.val().username || data.val().displayName;
                    if((uname.toLowerCase().indexOf(res.toLowerCase()) !== -1) && data.key != currentID) {
                        const list = document.createElement('div');
                        list.setAttribute('data-key', data.key);
                        list.classList.add('card', 'chat');
                        list.innerHTML = (`
                            <div class="name">
                                <img src="${s.pictureURL || s.photoURL}" alt="name"/>
                                <p class="username"></p>
                            </div>
                            <div class="status">
                                <p class="status-user">OFFLINE</p>
                            </div>
                        `);
                        
                        list.querySelector(`p.username`).innerText = uname;
                        list.querySelector(`p.status-user`).innerHTML = data.val().status == 'online' ? `<span class="c-blue">ONLINE</span>` : 'OFFLINE';
                        cardListElement.appendChild(list);
                        list.onclick = () => {
                            window.location.href = `${window.location.origin}/user/?gid=${data.key}`;
                        };
                    }
                });
                const nomore = document.createElement('div');
                nomore.style.textAlign = 'center';
                nomore.innerHTML = `<i class="c-yellow">${lang.nomore}</i>`;
                cardListElement.appendChild(nomore);
            }
        });

        prevFooter = document.createElement('footer');
        container.appendChild(prevMain);
    }

    const chatPage = () => {
        prevMain = document.createElement('main');
        prevMain.innerHTML = (`
            <div class="card-list list_people">
                <div class="nomore-chat" style="text-align: center;" id="user-loader">
                    ${lang.loading}
                </div>
            </div>
        `);
        
        get(ref(db, 'privateRoom')).then((list) => {
            const nomore = document.createElement('div');
            nomore.classList.add('nomore-chat');
            nomore.style.textAlign = 'center';

            const loadNomore = () => {
                if(prevMain.querySelector('#user-loader')) prevMain.querySelector('#user-loader').remove();
                nomore.innerHTML = `<i class="c-yellow">${lang.nomore}!</i>`;
                if(prevMain.querySelector('.nomore-chat')) prevMain.querySelector('.nomore-chat').remove();
                if(!prevMain.querySelector('.nomore-chat')) {
                    if(prevMain.querySelector('.card-list.list_people')) prevMain.querySelector('.card-list.list_people').appendChild(nomore);
                }
            }

            if(list.exists()) {
                let isRoomExist = false;
                if(prevMain.querySelector(`.list_chat`)) return;
                list.forEach((d) => {
                    if(d.val().first == currentID || d.val().second == currentID){
                        const accEl = document.createElement('div');
                        accEl.classList.add('card', 'chat', 'list_chat');
                        accEl.innerHTML = (`
                            <div class="name">
                                <img src="../data/img/profile.jpg" alt="name"/>
                                <div class="last-user">
                                    <p class="username">Loading</p>
                                    <p class="last-chat">Loading</p>
                                </div>
                            </div>
                            <div class="status">
                                <p class="status-user">OFFLINE</p>
                            </div>
                        `);

                        isRoomExist = true;

                        let peopleID;
                        let ourID;
                        if(d.val().first == currentID) {
                            peopleID = d.val().second;
                            ourID = `${currentID}_${d.val().second}`;
                        } else {
                            peopleID = d.val().first;
                            ourID = `${d.val().first}_${currentID}`;
                        }

                        get(ref(db, `users/${peopleID}`)).then((a) => {
                            let uname;
                            a.val().username ? uname = `@${a.val().username}` : uname = a.val().displayName;
                            
                            let upict = a.val().pictureURL || a.val().photoURL;

                            accEl.querySelector(`.name .last-user p.username`).innerText = `${uname.length > 15 ? uname.substring(0, 15) + '...' : uname}`;
                            accEl.querySelector(`.name img`).setAttribute('src', upict);
                            accEl.querySelector(`.name img`).setAttribute('alt', uname);
                            accEl.querySelector(`p.status-user`).innerHTML = a.val().status == 'online' ? `<span class="c-blue">ONLINE</span>` : 'OFFLINE';
                            if(prevMain.querySelector('.card-list.list_people')) prevMain.querySelector('.card-list.list_people').appendChild(accEl);

                            accEl.querySelector(`.name img`).onload = () => loadNomore();
                        });

                        get(query(ref(db, `private/${ourID}`), limitToLast(1))).then((data) => {
                            if(data.exists()) {
                                data.forEach((chat) => {

                                    const t = chat.val().type;
                                    if(t === undefined) {
                                        accEl.querySelector(`.name .last-user p.last-chat`).innerText = `> ${chat.val().msg.length > 30 ? chat.val().msg.substring(0, 27) + '...' : chat.val().msg}`;
                                    } else if(t == 'audio') {
                                        accEl.querySelector(`.name .last-user p.last-chat`).innerHTML = `&gt; <i class="fa-solid fa-microphone"></i> Voice Chat`;
                                    } else if(t == 'image') {
                                        accEl.querySelector(`.name .last-user p.last-chat`).innerHTML = `&gt; <i class="fa-solid fa-image"></i> Image`;
                                    } else if(t == 'file') {
                                        accEl.querySelector(`.name .last-user p.last-chat`).innerHTML = `&gt; <i class="fa-light fa-file"></i> File`;
                                    } else {
                                        accEl.querySelector(`.name .last-user p.last-chat`).innerHTML = `&gt; <i class="fa-light fa-comment-question"></i> Unknown`;
                                    }
                                })
                            } else {
                                accEl.querySelector(`.name .last-user p.last-chat`).innerHTML = `&gt; <i class="fa-light fa-comment-question"></i> Chat`;
                            }
                        })

                        accEl.onclick = () => window.location.href = `${window.location.origin}/chat/?r=user&gid=${peopleID}`;
                    }
                });

                if(isRoomExist === false) loadNomore();
            } else {
                loadNomore();
            }
        })

        prevFooter = document.createElement('footer');
        prevFooter.innerHTML = (`
            <button class="action" id="global-chat">
                <i class="fa-regular fa-globe"></i>
                Global Chat
            </button>
        `);

        prevFooter.querySelector(`#global-chat`).onclick = () => {
            window.location.href = `${window.location.origin}/chat/?r=global`;
        }

        userLocale.action.changePage('dashboard_chats');
        container.appendChild(prevMain);
        container.appendChild(prevFooter);
    }

    const randomPage = () => {
        prevMain = document.createElement('main');
        prevMain.innerHTML = (`
            <div class="card-find">
                <h2>${lang.find_random}</h2>
                <button class="action">
                    <i class="fa-solid fa-play"></i>
                    <b>${lang.start_now}</b>
                </button>
            </div>
        `);

        prevFooter = document.createElement('footer');

        const title = prevMain.querySelector(`h2`);
        const start = prevMain.querySelector(`button`);
        start.onclick = () => {
            title.innerHTML = `<i class="fa-duotone fa-spinner spinner"></i> ${lang.looking_for}..`;
            start.remove();

            getAllUSer();
        }

        const getAllUSer = () => {
            const luckyElement = document.createElement('main');
            luckyElement.innerHTML = (`
                <div class="card-list">
                    <div class="card chat" id="user-loader">
                        <div class="name">
                            <img src="../data/img/profile.jpg" alt="name"/>
                            <p class="username">Loading</p>
                        </div>
                        <div class="status">
                            <p>OFFLINE</p>
                        </div>
                    </div>
                </div>
            `);

            get(ref(db, 'users')).then((a) => {
                let allUser = [];
                a.forEach((al) => {
                    if(al.key != currentID) allUser.push(al);
                })
                const luckyPeople = allUser[Math.floor(Math.random() * allUser.length)];
                showLucky(luckyPeople);
            })

            const showLucky = (account) => {
                if(luckyElement.querySelector(`.card-list`)) {
                    const cardLucky = document.createElement('div');
                    cardLucky.classList.add('card', 'chat');
                    cardLucky.innerHTML = (`
                        <div class="name">
                            <img src="../data/img/profile.jpg" alt="name"/>
                            <p class="username">Loading</p>
                        </div>
                        <div class="status">
                            <p>OFFLINE</p>
                        </div>
                    `);

                    let a = account.val();
                    let getName = a.username ? `@${a.username}` : a.displayName;
                    let uname = getName.length > 15 ? `${getName.substring(0, 15)}...` : getName;
                    let upict = a.pictureURL || a.photoURL;

                    cardLucky.onclick = () => window.location.href = `${window.location.origin}/user/?gid=${account.key}`;

                    cardLucky.querySelector(`.name p.username`).innerText = uname;
                    cardLucky.querySelector(`.name img`).setAttribute('src', upict);
                    cardLucky.querySelector(`.name img`).setAttribute('alt', uname);
                    luckyElement.querySelector(`.card-list`).innerHTML = '';
                    luckyElement.querySelector(`.card-list`).appendChild(cardLucky);

                    prevMain.innerHTML = '';
                    prevMain.appendChild(luckyElement);
                }
            }
        }

        userLocale.action.changePage('dashboard_random');
        container.appendChild(prevMain);
    }

    const groupPage = () => {
        prevMain = document.createElement('main');
        prevMain.innerHTML = (`
            <div class="card-list list_guild">
                <div class="nomore-group" style="text-align: center;" id="group-loader">
                    ${lang.loading}
                </div>
            </div>
        `);


        get(ref(db, 'guild')).then((list) => {
            const nomore = document.createElement('div');
            nomore.classList.add('nomore-group');
            nomore.style.textAlign = 'center';

            const loadNomore = () => {
                if(prevMain.querySelector('#group-loader')) prevMain.querySelector('#group-loader').remove();
                nomore.innerHTML = `<i class="c-yellow">${lang.nomore}!</i>`;
                if(prevMain.querySelector('.nomore-group')) prevMain.querySelector('.nomore-group').remove();
                if(!prevMain.querySelector('.nomore-group')) {
                    if(prevMain.querySelector('.card-list.list_guild')) prevMain.querySelector('.card-list.list_guild').appendChild(nomore);
                }
            }

            if(list.exists()) {
                if(prevMain.querySelector(`.list_group`)) return;
                list.forEach((d) => {
                    get(ref(db, `guild/${d.key}/member/${currentID}`)).then((w) => {
                        if(w.exists()) {
                            const accEl = document.createElement('div');
                            accEl.classList.add('card', 'chat', 'list_group');
                            accEl.innerHTML = (`
                                <div class="name">
                                    <img src="../data/img/group.jpg" alt="name"/>
                                    <p class="username">Loading</p>
                                </div>
                                <div class="status">
                                    <p>Loading</p>
                                </div>
                            `);

                            accEl.onclick = () => {
                                window.location.href = `${window.location.origin}/chat/?r=group&gid=${d.key}`;
                            }

                            accEl.querySelector(`.name p.username`).innerText = d.val().username;
                            accEl.querySelector(`.name img`).setAttribute('src', d.val().photoURL || '../data/img/group.jpg');

                            get(ref(db, `guild/${d.key}/member`)).then((mem) => {
                                if(mem.exists()) {
                                    accEl.querySelector(`.status p`).innerText = `${lang.members}: ${mem.size}`;
                                }
                            })

                            if(prevMain.querySelector('.card-list.list_guild')) prevMain.querySelector('.card-list.list_guild').appendChild(accEl);

                            accEl.querySelector(`.name img`).onload = () => loadNomore();
                        } else {
                            loadNomore();
                        }
                    });
                })
            } else {
                loadNomore();
            }
        })

        prevFooter = document.createElement('footer');
        prevFooter.innerHTML = (`
            <button class="action" id="icon-join_group">${lang.join_group}</button>
            <button class="action" id="icon-create_group">${lang.create_group}</button>
        `);

        userLocale.action.changePage('dashboard_groups');

        container.appendChild(prevMain);
        container.appendChild(prevFooter);

        prevFooter.querySelector('#icon-create_group').onclick = () => window.location.href = window.location.origin + '/group/create/';

        prevFooter.querySelector('#icon-join_group').onclick = () => popup.prompt({
            msg: 'Group ID:',
            onyes: (res) => searchGroup(res)
        });

        const searchGroup = async (id) => {

            let isGroupExist = false;
            await get(ref(db, `guild/${id}`)).then((g) => {
                if(g.exists()) {
                    isGroupExist = true;
                }
            });
            
            if(isGroupExist === false) return popup.alert(lang.id_doesnt_match);

            window.location.href = `${window.location.origin}/group/?gid=${id}`;
        }
    }

    const postPage = () => {
        prevMain = document.createElement('main');
        prevMain.innerHTML = (`
            <div class="card-list post-list">
                <div class="card post" id="post-loader">
                    <h1 align="center">${lang.loading}</h1>
                </div>
            </div>
        `);

        prevFooter = document.createElement('footer');
        prevFooter.innerHTML = (`
            <button class="action" id="icon-create_post">
                <i class="fa-solid fa-plus"></i>
                ${lang.create_post}
            </button>
        `);

        get(ref(db, 'post')).then((p) => {
            const listPage = prevMain.querySelector(`.card-list.post-list`);
            if(p.exists()) {
                const allCard = document.createElement('div');
                allCard.classList.add('card-list', 'post-list');
                
                p.forEach((k) => {
                    const post = document.createElement('div');
                    post.classList.add('card', 'post');
                    post.innerHTML = (`
                    <div class="top-card">
                        <div class="left">
                            <img id="photo-sender" src="../data/img/profile.jpg" alt="user"/>
                            <p id="post-sender">User A</p>
                        </div>
                        <div class="right">
                            <button id="top-right-btn">
                                <i class="fa-light fa-envelope"></i>
                            </button>
                        </div>
                    </div>
                    <div class="image-card"></div>
                    <div class="time-card">
                        <p class="hour">Loading</p>
                        <p class="date">Loading</p>
                    </div>
                    <div class="data-card">
                        <button class="action" id="post-like">Loading</button>
                        <button class="action" id="post-comment">Loading</button>
                    </div>
                    <div class="bottom-card">
                        <p>${lang.loading}</p>
                    </div>
                    `);

                    const newImage = document.createElement('img');
                    newImage.src = k.val().photoURL;
                    newImage.addEventListener('error', () => {
                        newImage.src = '../../data/img/error_image.jpg';
                    });
                    post.querySelector(`.image-card`).appendChild(newImage);
                    
                    const aEl = document.createElement('a');
                    aEl.style.textDecoration = 'underline';
                    aEl.style.cursor = 'pointer';
                    aEl.textContent = lang.read_more;

                    const lowerLength = (msg) => {
                        let maxMsg = false;
                        post.querySelector(`.bottom-card p`).innerText = (`${msg.replace(/\n/g, ' ').substring(0, 150)}... `);
                        post.querySelector(`.bottom-card p`).append(aEl);
                        aEl.onclick = () => {
                            if(maxMsg === false) {
                                post.querySelector(`.bottom-card p`).innerText = `${msg}\n`;
                                aEl.textContent = lang.read_less;
                                post.querySelector(`.bottom-card p`).append(aEl);
                                maxMsg = true;
                            } else {
                                post.querySelector(`.bottom-card p`).innerText = (`${msg.replace(/\n/g, ' ').substring(0, 150)}... `);
                                aEl.textContent = lang.read_more;
                                post.querySelector(`.bottom-card p`).append(aEl);
                                maxMsg = false;
                            }
                        }
                    }

                    if(k.val().msg.includes('\n')) {
                        const line_break = Array.from(k.val().msg);
                        let count = 0;
                        line_break.forEach((t) => {
                            if(t == '\n') count++;
                        });
                        if(count > 5) {
                            lowerLength(k.val().msg);
                        } else {
                            if(k.val().msg.length > 150) {
                                lowerLength(k.val().msg)
                            } else {
                                post.querySelector(`.bottom-card p`).innerText = k.val().msg;
                            }
                        }
                    } else if(k.val().msg.length > 150) {
                        lowerLength(k.val().msg);
                    } else {
                        post.querySelector(`.bottom-card p`).innerText = k.val().msg;
                    }
                    

                    (() => {
                        const timeElementHours = post.querySelector(`.time-card p.hour`);
                        const timeElementDate = post.querySelector(`.time-card p.date`);

                        const time = k.val().time.toString();
                        const jam = `${time.split('')[11]}${time.split('')[12]}`;
                        const menit = `${time.split('')[3]}${time.split('')[4]}`;
                        const tanggal = `${time.split('')[9]}${time.split('')[10]}`;
                        const bulan = `${time.split('')[1]}${time.split('')[2]}`;
                        const tahun = `${time.split('')[5]}${time.split('')[6]}${time.split('')[7]}${time.split('')[8]}`;

                        let utcDate = `${tahun}/${bulan}/${tanggal} ${jam}:${menit}:00 UTC`;
                        let dt = new Date(utcDate);

                        const date = {
                            hour: dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours(),
                            minute: dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes(),
                            date: dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate(),
                            month: dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1,
                            year: dt.getFullYear(),
                        }

                        timeElementHours.innerText = `${date.hour}:${date.minute}`;
                        timeElementDate.innerText = `${date.date}/${date.month}/${date.year}`;
                    })();

                    let senderName;
                    get(ref(db, 'users/' + k.val().owner)).then((a) => {
                        let uname = a.val().username ? `@${a.val().username}` : a.val().displayName;
                        uname.length > 15  ? uname = uname.substring(0, 15) + '...' : uname = uname;

                        senderName = uname;

                        post.querySelector(`#post-sender`).innerText = uname;
                        post.querySelector(`#photo-sender`).setAttribute('src', a.val().pictureURL || a.val().photoURL);

                        post.querySelector(`.top-card .left`).onclick = () => window.location.href = `${window.location.origin}/user/?gid=${k.val().owner}`;
                    });

                    
                    const actionBtn = post.querySelector(`#top-right-btn`);
                    if(k.val().owner == currentID) {
                        actionBtn.innerHTML = (`<i class="fa-regular fa-trash c-red"></i>`);

                        actionBtn.onclick = () => {
                            popup.confirm({
                                msg: lang.do_delete_post,
                                type: 'danger',
                                onyes: () => {
                                    deleteObject(sref(storage, k.val().path)).then(() => {
                                        remove(ref(db, `post/${k.key}`));
                                        prevMain.remove();
                                        prevFooter.remove();
                                        postPage();
                                    }).catch((err) => popup.alert(err));
                                }
                            });
                        }

                    } else {
                        actionBtn.onclick = () => {
                            window.location.href = `${window.location.origin}/chat/?r=user&gid=${k.val().owner}`;
                        }
                    }

                    const getLike = () => {
                        const likeEL = post.querySelector(`#post-like`);
                        let likeRef = ref(db, `post/${k.key}/like`);

                        get(likeRef).then((likes) => {
                            let liked = false;
                            if(likes.exists()) {
                                likeEL.innerHTML = `<i class="fa-light fa-heart"></i> ${likes.size > 1 ? likes.size + ' ' + lang.likes : likes.size + ' ' + lang.like}`;
                                likes.forEach((l) => {
                                    if(l.key == currentID) {
                                        liked = true;
                                        likeEL.innerHTML = `<i class="fa-solid fa-heart"></i> ${likes.size > 1 ? likes.size + ' ' + lang.likes : likes.size + ' ' + lang.like}`;
                                    }
                                });
                            } else {
                                likeEL.innerHTML = `<i class="fa-light fa-heart"></i> 0 ${lang.like}`;
                            }
    
                            likeEL.onclick = async () => {
                                if(liked == false) {
                                    likeEL.innerHTML = `<i class="fa-duotone fa-heart"></i> ${lang.liked}`;
                                    await set(child(likeRef, currentID), {liked: true});
                                    liked = true;
                                } else {
                                    likeEL.innerHTML = `<i class="fa-solid fa-heart-crack"></i> ${lang.unliked}`;
                                    await remove(child(likeRef, currentID));
                                    liked = false;
                                }
                                getLike();
                            }
                        });
                    }

                    const commentEL = post.querySelector(`#post-comment`);
                    const getComment = () => {
                        let commentRef = ref(db, `post/${k.key}/comment`);
                        get(commentRef).then((comments) => {
                            if(comments.exists()) {
                                commentEL.innerHTML = `<i class="fa-light fa-comment"></i> ${comments.size > 1 ? comments.size + ' ' + lang.comments : comments.size + ' ' + lang.comment}`;
                            } else {
                                commentEL.innerHTML = `<i class="fa-light fa-comment"></i> 0 ${lang.comment}`;
                            }
                        })
                    }

                    const getCommentData = (field, key) => {
                        let comRef = ref(db, `post/${key}/comment`);
                        get(comRef).then((c) => {
                            if(c.exists()) {
                                field.innerHTML = '';
                                c.forEach((u) => {
                                    const comPost = document.createElement('div');
                                    comPost.classList.add('card-comment');
                                    comPost.innerHTML = (`
                                    <div class="photo-card" data-comment="photo"></div>
                                    <div class="message-card">
                                        <p class="msg">
                                            <b data-comment="username">${lang.loading}</b>
                                            <span data-comment="message">${lang.loading}</span>
                                        </p>
                                        <p data-comment="time" class="date-time">--:-- --/--/--</p>
                                    </div>
                                    `);

                                    const message = comPost.querySelector(`[data-comment="message"]`);
                                    message.innerText = u.val().msg;

                                    (() => {
                                        const timeElement = comPost.querySelector(`[data-comment="time"]`);
                                        const time = u.val().time.toString();
                                        const jam = `${time.split('')[11]}${time.split('')[12]}`;
                                        const menit = `${time.split('')[3]}${time.split('')[4]}`;
                                        const tanggal = `${time.split('')[9]}${time.split('')[10]}`;
                                        const bulan = `${time.split('')[1]}${time.split('')[2]}`;
                                        const tahun = `${time.split('')[5]}${time.split('')[6]}${time.split('')[7]}${time.split('')[8]}`;
                
                                        let utcDate = `${tahun}/${bulan}/${tanggal} ${jam}:${menit}:00 UTC`;
                                        let dt = new Date(utcDate);
                
                                        const date = {
                                            hour: dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours(),
                                            minute: dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes(),
                                            date: dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate(),
                                            month: dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1,
                                            year: dt.getFullYear(),
                                        }

                                        timeElement.innerText = `${date.hour}:${date.minute} - ${date.date}/${date.month}/${date.year}`;
                                        
                                        if(u.val().sender == currentID) {
                                            const deleteComment = document.createElement('button');
                                            deleteComment.style.backgroundColor = 'transparent';
                                            deleteComment.style.fontSize = '12px';
                                            deleteComment.style.marginLeft = '5px';
                                            deleteComment.innerHTML = (`<i class="c-red fa-light fa-trash"></i>`);
                                            deleteComment.onclick = () => popup.confirm({
                                                msg: lang.do_delete_comment,
                                                type: 'danger',
                                                onyes: () => {
                                                    remove(child(comRef, u.key));
                                                    getCommentData(field, key);
                                                    getComment();
                                                },
                                            });
                                            timeElement.append(deleteComment);
                                        }
                                    })();

                                    get(ref(db, `users/${u.val().sender}`)).then((s) => {
                                        let uname = s.val().username ? `@${s.val().username}` : s.val().displayName;
                                        uname.length > 15  ? uname = uname.substring(0, 15) + '...' : uname = uname;
                                        comPost.querySelector(`[data-comment="username"]`).innerText = uname;
                                        comPost.querySelector(`[data-comment="username"]`).style.cursor = 'pointer';
                                        comPost.querySelector(`[data-comment="username"]`).onclick = () => {
                                            window.location.href = `${window.location.origin}/user/?gid=${u.val().sender}`;
                                        };

                                        let upict = s.val().pictureURL || s.val().photoURL;
                                        comPost.querySelector(`[data-comment="photo"]`).innerHTML = `<img src="${upict}" width="30" height="30" />`;
                                    });

                                    field.prepend(comPost);
                                });
                            } else {
                                field.innerHTML = `<p>${lang.nocomment}</p>`;
                            }
                        });
                    }

                    const sendComment = (input, res, key, field) => {
                        if(res.length < 1) return;
                        if(res.length > 200) return popup.alert(`${lang.your_text_1} ${res.length} ${lang.your_text_2}`);

                        input.value = '';

                        const now = new Date().getTime().toString();
                        let jam = new Date().getUTCHours();
                        if(jam < 10) jam = '0' + jam;
                        let menit = new Date().getUTCMinutes();
                        if(menit < 10) menit = '0' + menit;
                        let tanggal = new Date().getUTCDate();
                        if(tanggal < 10) tanggal = '0' + tanggal;
                        let bulan = new Date().getUTCMonth();
                        bulan = bulan + 1;
                        if(bulan < 10) bulan = '0' + bulan;
                        let tahun = new Date().getUTCFullYear();
                        if(tahun < 10) tahun = '0' + tahun;


                        update(ref(db, `post/${key}/comment/${now}`), {
                            msg: res.replace(/^\s+/g, '').replace(/ +(?= )/g,'').replace(/^\n+/g, '').replace(/\n /g, '\n').replace(/\n+(?=\n\n)/g, ''),
                            time: parseInt(`7${bulan}${menit}${tahun}${tanggal}${jam}`),
                            sender: currentID
                        });
                        getCommentData(field, key);
                        getComment();
                    }

                    commentEL.onclick = () => {
                        const commentSectBefore = container.querySelector(`.Comment-section`);
                        if(commentSectBefore) {
                            if(k.key == commentSectBefore.getAttribute('data-room')) {
                                return;
                            } else {
                                commentSectBefore.remove();
                            }
                        }
                        const commentSect = document.createElement('div');
                        commentSect.classList.add('Comment-section');
                        commentSect.setAttribute('data-room', k.key);
                        commentSect.innerHTML = (`
                        <div class="comment-header">
                            <button data-comment="back">
                                <i class="fa-solid fa-arrow-left"></i>
                            </button>
                            <b id="comment-sender">Comment</b>
                            <p id="comment-msg">: Lorem ipsum dolor sit amet...</p>
                        </div>
                        <div class="comment-main">Loading</div>
                        <div class="comment-footer">
                            <input maxlength="200" type="text" placeholder="${lang.type_some}.."/>
                            <button>${lang.send}</button>
                        </div>
                        `);

                        const back = commentSect.querySelector(`[data-comment="back"]`);
                        back.onclick = () => {
                            commentSect.classList.add('deleted');
                            setTimeout(() => {
                                commentSect.remove()
                            }, 250);
                        };

                        const comSender = commentSect.querySelector(`#comment-sender`);
                        comSender.innerText = senderName;

                        const comMsg = commentSect.querySelector(`#comment-msg`);
                        comMsg.innerText = `: ${k.val().msg.replace(/\n/g, ' ').substring(0, 20)}...`;

                        const field = commentSect.querySelector(`.comment-main`);

                        const input = commentSect.querySelector(`.comment-footer input`);
                        input.onkeyup = () => input.value = input.value.replace(/^\s+/g, '').replace(/ +(?= )/g,'').replace(/^\n+/g, '').replace(/\n /g, '\n').replace(/\n+(?=\n\n)/g, '');

                        const send = commentSect.querySelector(`.comment-footer button`);
                        send.onclick = () => sendComment(input, input.value, k.key, field);
                        
                        input.onkeypress = (e) => {
                            if(e.keyCode == 13) send.click();
                        }
                        
                        getCommentData(field, k.key);

                        prevMain.appendChild(commentSect);
                    }

                    getLike();
                    getComment();

                    allCard.prepend(post);
                    newImage.onload = () => {
                        if(prevMain.querySelector(`#post-loader`)) prevMain.querySelector(`#post-loader`).remove();
                        if(listPage) listPage.replaceWith(allCard);
                    }
                });
            } else {
                if(prevMain.querySelector(`#post-loader`)) prevMain.querySelector(`#post-loader`).innerHTML = `<div class="bottom-card" style="display:flex;justify-content:center"><h2>${lang.nopost}</h2></div>`;
            }
        });

        prevFooter.querySelector('#icon-create_post').onclick = () => window.location.href = window.location.origin + '/post/create/';

        userLocale.action.changePage('dashboard_posts');
        container.appendChild(prevMain);
        container.appendChild(prevFooter);
    }

    const changePage = (prevMain, prevFooter, next, activate, res = null) => {
        if(prevMain == null || prevFooter == null || prevButton == null) {
            activate.classList.add('enabled');
            prevButton = activate;
            next(res);
            return;
        }

        prevMain.classList.add('deleted');
        prevFooter.classList.add('deleted');
        prevButton.classList.remove('enabled');
        activate.classList.add('enabled');
        prevButton = activate;
        setTimeout(() => {
            const mainall = container.querySelector('main');
            const footerall = container.querySelector('footer');

            if(mainall) mainall.remove();
            if(footerall) footerall.remove();

            prevMain.remove();
            prevFooter.remove();
            next(res);
        }, 300);
    }

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
        
        lang = getLang[currentLang].Dashboard;
    }
    langCheker();

    onAuthStateChanged(auth, (user) => {
        container.innerHTML = `${lang.preparing}`;
        if(user) {
            getID(user).then((res) => {
                currentID = res;
                if(res === null) window.location.reload();
                createElement();
            });
        } else {
            window.location.href = window.location.origin + '/login/';
        }
    })
})();
// ==UserScript==
// @name         instagram post downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.instagram.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...



class InstagramPostDownloader{
    constructor(){

    }

    init(){
        if(location.href.indexOf('/p/') == -1){
            alert('not post');
            return false;
        }
        let postPage = window._sharedData.entry_data.PostPage[0];
        this.graphql = postPage.graphql;
        this.__typename = this.graphql.shortcode_media.__typename;
        this.shortcode = this.graphql.shortcode_media.shortcode;
        console.log(this.shortcode);
        console.log(this.__typename);
        this.dl_urls = [];
        return true;
    }

    setDlurls(){
        let disp;
        if(this.__typename == 'GraphImage'){
            disp = this.graphql.shortcode_media.display_url;
            console.log(disp);
            this.dl_urls.push(disp);
        }else if(this.__typename == 'GraphSidecar'){
            var edges = this.graphql.shortcode_media.edge_sidecar_to_children.edges;
            for(let i = 0; i < edges.length; i++){
                var ed = edges[i];
                if(ed.node.__typename == 'GraphVideo'){
                    disp = ed.node.video_url;
                }else{
                    disp = ed.node.display_url;
                }
                console.log(disp);
                this.dl_urls.push(disp);
            }
        }else if(this.__typename == 'GraphVideo'){
            disp = this.graphql.shortcode_media.video_url;
            console.log(disp);
            this.dl_urls.push(disp);
        }else{
            alert('invalid __typename: ' + this.__typename);
        }
    }

    setProg(per){
        const btn = document.getElementById('mybutton');
        btn.innerText = `${this.cur}/${this.len}: ${per}%`;
    }

    endProg(){
        const btn = document.getElementById('mybutton');
        btn.innerText = 'DOWNLOADS';
        this.dl_urls = [];
    }

    async rq(settings){
        const _this = this;
        // responseType: arraybuffer blob document json text
        function _rq(resolve){
            const xhr = new XMLHttpRequest();
            xhr.onprogress = function(e){
                let per = e.loaded / e.total * 100;
                per = parseInt(per);
                _this.setProg(per);
            };
            xhr.onload = function(){
                console.log(xhr.status);
                if(xhr.readyState != 4){return;}
                if(xhr.status !== 200){
                    console.error('status = ' + xhr.status);
                    alert('request error\n' + settings.url);
                    resolve(null);
                }
                resolve(xhr.response);
            };
            console.log(settings.url);
            xhr.open('GET', settings.url, true);
            xhr.responseType = settings.dataType;
            xhr.send();
        }
        // resolveまで待って返せる
        return new Promise(_rq);
    }

    async dls(){
        const mybutton = document.querySelector('#mybutton');
        mybutton.disabled = true;
        this.len = this.dl_urls.length;

        for(let i = 0; i < this.dl_urls.length; i++){
            this.cur = i + 1;
            let dl_url = this.dl_urls[i];
            let fn = dl_url.split('?')[0].split('/').pop();
            fn = this.shortcode + '_' + fn;
            let _b = await this.rq(
                {url: dl_url, dataType: 'blob'}
            );
            if(! _b){return;}
            const url = URL.createObjectURL(_b);
            this.dl(url, fn);
        }

        mybutton.disabled = false;
        this.endProg();
    }

    dl(url, fn){
        const _a = document.createElement('a');
        _a.href = url;
        _a.setAttribute('download', fn);
        _a.click();
    }

    run(){
        let ret = this.init();
        if(! ret){return;}
        this.setDlurls();
        this.dls();
    }
}


function makeDiv(){
    const div = document.createElement('div');
    div.innerHTML = `
    <style>
    #mybutton{
        position: sticky;
        opacity: 1;
        bottom:20%;
        right: 5%;
        position:fixed;
        background: #0095f6;
        color: white;
        height: 10%;
        width: 20%;
        font-size: 20px;
        font-weight: bold;
        text-align: center;
        z-index: 1000;
    }
    #mybutton:disabled{
        opacity: 0.4;
        animation-name: anime1;
        animation-duration: 1s;
        animation-timing-function: ease;
        animation-iteration-count: infinite;
        animation-direction:alternate;
    }
    @keyframes anime1{
        0% {height: 10%;}
        100% {height: 5%;}
    }
    </style>
    <button id="mybutton" onclick="window.ipd.run();">
        DOWNLOADS
    </button>
    `;
    document.body.appendChild(div);
}


let ipd = new InstagramPostDownloader();
console.log(ipd);
window.ipd = ipd;
makeDiv();



})();


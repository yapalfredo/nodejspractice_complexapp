export default class Chat {
    constructor(){
        this.openedFirstTime = false
        this.chatWrapper = document.querySelector("#chat-wrapper")
        this.openIcon = document.querySelector(".header-chat-icon")
        this.injectHTML()
        this.chatLog = document.querySelector("#chat")
        this.chatField = document.querySelector("#chatField")
        this.chatForm = document.querySelector("#chatForm")
        this.closeIcon = document.querySelector(".chat-title-bar-close")
        this.events()
    }

    // Events 
    events(){
        this.openIcon.addEventListener("click", () => this.showChat())
        this.closeIcon.addEventListener("click", () => this.closeChat())

        this.chatForm.addEventListener("submit", (e) => {
            e.preventDefault()
            this.sendMessageToServer()
        })
    }

    // Methods
    sendMessageToServer(){
        this.socket.emit('chatMessageFromBrowser', {message: this.chatField.value})
        this.chatField.value = ''
        this.chatField.focus()
    }

    showChat(){
        if (!this.openedFirstTime) {
            this.openConnection()
            this.openedFirstTime = true
        }

        this.chatWrapper.classList.add("chat--visible")
    }
    

    closeChat(){
        this.chatWrapper.classList.remove("chat--visible")
    }

    openConnection() {
        this.socket = io()
        this.socket.on('chatMessageFromServer', (data) => {
            this.populateMessageFromServer(data)
        })
    }

    populateMessageFromServer(data){
        this.chatLog.insertAdjacentHTML("beforeend", `
        <!-- template for messages from others -->
        <div class="chat-other">
          <a href="#"><img class="avatar-tiny" src="${data.avatar}"></a>
          <div class="chat-message"><div class="chat-message-inner">
            <a href="#"><strong>${data.username}</strong></a>
            ${data.message}
          </div></div>
        </div>
        <!-- end template-->
        `)
    }

    injectHTML(){
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
        <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        `
    }
}
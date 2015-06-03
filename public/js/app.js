var websocketClient = new Faye.Client(fayeUrl());
var subscriptions = {};
var username;

$(document).ready(function() {
  $('#chatroom-name').on('submit', function(e) {
    e.preventDefault();
    chatroom = $('#roomname').val();
    username = $('#username').val();
    $('#mycomment').removeAttr('disabled');
    joinChatroom(chatroom);
    $('#join-room,#username,#roomname').attr('disabled', true);
  });

  $('#leave-room').on('click', function(e) {
    e.preventDefault();
    $('#join-room,#username,#roomname').removeAttr('disabled');
    chatroom = $('#roomname').val();
    $('#username,#roomname').val('');
    leaveChatroom(chatroom);
  });

  $('#mychat').on('submit', function(e) {
    e.preventDefault();
    body = $('#mycomment').val();
    chatroom = $('#roomname').val();
    username = $('#username').val();
    sendChatMessage(chatroom, username, body);
  });
});

function joinChatroom(roomName) {
  console.log('joining', roomName);
  subscriptions[roomName] = websocketClient.subscribe('/' + roomName, function(data) {
    console.log('Received message from', data.roomname, data);
    appendChatMessage(data);
    scrollToBottomOfChat();
  });
}

function sendChatMessage(roomName, username, body) {
  console.log('sending -', body, '- from -', username, '- to -', roomName);
  websocketClient.publish('/' + roomName, {
    username: username,
    roomname: roomName,
    body: body
  });
}

function leaveChatroom(roomName) {
  subscriptions[roomName].cancel();
}

function appendChatMessage(message) {
  $('#chatroom').text(
      $('#chatroom').text() + '\n' +
        message.username + ' (' + message.roomname + '): ' + message.body
    );
}

function scrollToBottomOfChat() {
  $('#chatroom').scrollTop($('#chatroom').prop("scrollHeight"))
}

function fayeUrl() {
  return 'http://' + window.location.hostname + ':' + window.location.port + '/faye';
}

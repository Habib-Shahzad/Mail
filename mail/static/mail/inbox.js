document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector("#compose-form").addEventListener("submit", compose);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}



function compose() {
  event.preventDefault();
  recipients =  document.querySelector("#compose-recipients");
  subject = document.querySelector("#compose-subject");
  body = document.querySelector("#compose-body");
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients.value,
        subject: subject.value,
        body: body.value
    })
  })
  .then(response => response.json())
  .then(result => {
      console.log(result.status);
    if (result.status === 201) {
      load_mailbox('sent');
    }

  });
}

function reload() {
  location.reload();
  return false;
}


function load_mailbox(mailbox,justAr=false) {
  
  // Show the mailbox and hide other views
  
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  if (justAr) {
    if (mailbox == 'inbox') {
      reload();
    } 
  }

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach((element) => {  
      var div = document.createElement("div");
      div.style.width = "500px";
      div.style.height = "80px";
      div.style.background='white';
      if (mailbox == "inbox") {
        if (element.read) { div.style.background = "silver";}}
      div.style.border = "2px solid gray";
      div.style.color = "black";
      div.style.borderRadius = "12px";
      div.style.padding = "10px";
      div.style.whiteSpace =  "pre-wrap";
      div.innerHTML = `${element.subject} | ${element.recipients} | ${element.timestamp} <br> `;
      var space = document.createElement("space")
      space.innerHTML = `<br>`
      document.querySelector("#emails-view").appendChild(div);
      div.addEventListener("click", () => {
        view_mail(element.id, mailbox);
      });
      document.querySelector("#emails-view").appendChild(space);
    });
  });
}

function view_mail(id, mailbox) {

  is_read(id)
  
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);
    document.querySelector("#emails-view").innerHTML = "";
    var div = document.createElement("div");
    div.innerHTML = `Sender: ${email.sender}  <br> Recipients: ${email.recipients} <br> Subject: ${email.subject} <br> <div style = white-space:pre-wrap;'> Body: ${email.body} </div> <br>  Time: ${email.timestamp} <br> <br>`
    document.querySelector("#emails-view").appendChild(div);

    if (mailbox!="sent") {
        var button = document.createElement("button")
        button.style.height = '40px';
        button.style.width = '100px';
        button.style.textAlign = 'center';
        button.style.padding = "15px 32px;"
        button.style.borderRadius = "3px";
        button.style.backgroundColor = "#4CAF50";
        button.style.color = "white";
        if (email.archived) {button.innerHTML = "Unarchive"}
        else {button.innerHTML = "Archive"}
        document.querySelector("#emails-view").appendChild(button);

        button.addEventListener("mouseover", () => { button.style.fontWeight = 'bold'; button.style.border = "1px solid #140d50"; });
        button.addEventListener("mouseout", () => { button.style.fontWeight = '500'; });

        button.addEventListener("click", () => {
          is_archive(email.archived, email.id, button);
        });

        var reply = document.createElement("button")
        reply.style.height = '40px';
        reply.style.width = '100px';
        reply.style.borderRadius = '3px';
        reply.style.backgroundColor = "#4CAF50";
        reply.style.color = "white";
        reply.innerHTML = 'Reply'
        document.querySelector("#emails-view").appendChild(reply);
        reply.addEventListener("mouseover", () => { reply.style.fontWeight = 'bold'; reply.style.border = "1px solid #140d50"; });
        reply.addEventListener("mouseout", () => { reply.style.fontWeight = '500'; });

        
        reply.addEventListener("click", () => {
          replied(email, reply);
        });

      }
    })


}


function is_read(id) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}

function is_archive(arch,id) {
  if (arch) {
    fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        archived: false,
      }),
    });

  }

  else {fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: true,
    }),
  });

}
load_mailbox('inbox', true);
}


function replied(email) {
  compose_email();
  if (!/^Re:/.test(email.subject)) email.subject = `Re: ${email.subject}`;
  document.querySelector("#compose-recipients").value = email.sender;
  document.querySelector("#compose-subject").value = email.subject;
  document.querySelector("#compose-body").value =  `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n`;
  email.body = "";
}
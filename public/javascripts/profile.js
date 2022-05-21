// CHANGE USER NAME FORM
const userName = document.getElementById('user-name');
const userNameEdit = document.getElementById('user-name-edit');
const userNameForm = document.getElementById('user-name-form');
// SHOW EDIT ICON WHEN HOVE ON USER NAME
userName.onmouseover = () => {
  userNameEdit.classList.remove('d-none');
}
// HIDE EDIT ICON WHEN REMOVE MOUSE OUT OF USER NAME
userName.onmouseout = () => {
  userNameEdit.classList.add('d-none');
}
// SHOW AND HIDE EDIT USER NAME FORM WHEN CLICK ON EDIT ICON
userNameEdit.onclick = () => {
  userNameForm.classList.toggle('d-none');
}
// CHANGE USER EMAIL FORM
const changeEmailBtn = document.getElementById('change-email-btn');
const changeEmailForm = document.getElementById('change-email-form');
changeEmailBtn.onclick = () => {
  changeEmailForm.classList.toggle('d-none');
}

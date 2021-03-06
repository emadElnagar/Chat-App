// LIVE PREVIEW FOR PROFILE IMAGE CHANGE
let profileInput = document.getElementById('profile-img');
let profileLabel = document.getElementById('profile-label');
let profileFormSubmition = document.getElementById('profile-form-submition');
let profileForm = document.getElementById('profile-form');
profileInput.onchange = function () {
  const reader = new FileReader();
  reader.readAsDataURL(this.files[0]);
  reader.onload = function () {
    document.getElementById('profile-image').src = this.result;
    profileLabel.classList.add('d-none');
    profileFormSubmition.classList.remove('d-none');
    profileForm.classList.add('active-form');
  }
}
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
// CHANGE PASSWORD FORM
const changePasswordBtn = document.getElementById('change-password-btn');
const changePasswordForm = document.getElementById('change-password-form');
changePasswordBtn.onclick = () => {
  changePasswordForm.classList.toggle('d-none');
}

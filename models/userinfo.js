function UserInfo(_error,_title, _header, _firstName, _lastName, _emailAddr, _regStatus, _regDate ) {       // Accept name and age in the constructor
    this.error = _error || 'null';
    this.title = _title || 'null';
    this.header  = _header  || 'null';
    this.firstName  = _firstName  || 'null';
    this.lastName  = _lastName  || 'null';
    this.emailAddr  = _emailAddr  || 'null';
    this.regStatus  = _regStatus  || 'null';
    this.regDate  = _regDate  || 'null';
}

UserInfo.prototype.setError = function(_error) {
    this.error = _error;
}

UserInfo.prototype.setTitle = function(_title) {
    this.title = _title;
}
UserInfo.prototype.setHeader = function(_header) {
    this.header = _header;
}
UserInfo.prototype.setFirstName = function(_firstName) {
    this.firstName = _firstName;
}
UserInfo.prototype.setLastName = function(_lastName) {
    this.lastName = _lastName;
}
UserInfo.prototype.setEmailAddr = function(_emailAddr) {
    this.emailAddr = _emailAddr;
}
UserInfo.prototype.setRegStatus = function(_regStatus) {
    this.regStatus = _regStatus;
}
UserInfo.prototype.setRegDate = function(_regDate) {
    this.regDate = _regDate;
}

module.exports = UserInfo;     
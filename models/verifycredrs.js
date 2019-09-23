function verifyCredRs(_error, _id) {       // Accept name and age in the constructor
    this.error = _error || null;
    this.id  = _id  || null;
}

verifyCredRs.prototype.getError = function() {
    return this.error;
}

verifyCredRs.prototype.setError = function(_error) {
    this.error = _error;
}

verifyCredRs.prototype.getId = function() {
    return this.id;
}

verifyCredRs.prototype.setId = function(_id) {
    this.id = _id;
}


module.exports = verifyCredRs;     
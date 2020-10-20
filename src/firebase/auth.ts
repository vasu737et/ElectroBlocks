export const loginGoogleUser = async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await firebase.auth().signInWithPopup(provider);
  console.log(result, "result");
};

export const logout = async () => {
  await firebase.auth().signOut();
};

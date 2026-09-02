export function Knight() {
  return (
    <>
      {/* Head and neck in one silhouette: muzzle low-left, ear top-right,
          mane down the right, flaring into the collar. */}
      <path d="M 20.4 12.2 L 19.8 8.6 C 19.7 7.6 20.7 7 21.5 7.6 L 25.4 10.6 C 29 13.2 31.4 17 32.3 21.6 C 33 25.4 33 30.2 32.6 33.6 L 15.6 33.6 C 15.4 29.4 16.6 25.6 19.2 22.6 C 17.8 22.2 16.6 22.8 15.8 24 L 14.2 26.4 C 13.2 27.8 11.2 27.4 10.9 25.6 C 10.6 23.6 11.2 21.4 12.6 19 C 14.4 15.8 17.1 13.4 20.4 12.2 Z" />
      <circle className="detail" cx="19.6" cy="17.4" r="1" />
      <path className="detail" d="M 13.6 23.8 L 15.6 23.2" />
      <path d="M 11.5 40.5 L 33.5 40.5 C 33.5 37.6 31.6 35.5 29 35.5 L 16 35.5 C 13.4 35.5 11.5 37.6 11.5 40.5 Z" />
    </>
  );
}

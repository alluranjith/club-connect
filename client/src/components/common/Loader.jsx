const Loader = ({ fullscreen }) => (
  <div
    className="flex-center"
    style={fullscreen ? { minHeight: '100vh' } : { minHeight: 200 }}
  >
    <div className="spinner" />
  </div>
);

export default Loader;

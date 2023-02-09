const originalEmit = process.emit;
process.emit = function (event, error) {
  if (
    event === 'warning' &&
    error.name === 'ExperimentalWarning' &&
    error.message.includes('Custom ESM Loaders')
  ) {
    return false;
  }

  return originalEmit.apply(process, arguments);
};

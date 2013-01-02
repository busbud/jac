#jac-img
jac-img provides methods to reference image urls using permanently cachable urls.

It achieves this by using urls unique to each version of a given image, and provides middleware to serve the image with
long cache durations.

#Usage
## Production
To support production usage with the best performance, it is required that a pre-processing step be executed to
generate the image file digests stored in configuration.
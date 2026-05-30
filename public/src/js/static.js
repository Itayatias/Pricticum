const footerYear = document.createElement('span');
footerYear.textContent = new Date().getFullYear();

const footer = document.querySelector('.page-footer p');
if (footer) {
  footer.textContent = `© ${footerYear.textContent} BuildStrong. חנות חומרי בניין מקצועית.`;
}

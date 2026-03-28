module.exports = function (eleventyConfig) {

  // Copy static assets straight through to _site/
  eleventyConfig.addPassthroughCopy("public");       // images, icons, etc.
  eleventyConfig.addPassthroughCopy("css");          // shared.css + page CSS
  eleventyConfig.addPassthroughCopy("**/*.js");      // app.js, utils.js, etc.
  eleventyConfig.addPassthroughCopy("CNAME");        // needed for GitHub Pages
  eleventyConfig.addPassthroughCopy("**/*.png");
  eleventyConfig.addPassthroughCopy("**/*.gif");
  eleventyConfig.addPassthroughCopy("**/*.svg");
  eleventyConfig.addPassthroughCopy("**/*.webmanifest");
  eleventyConfig.addPassthroughCopy("**/*.json");
  eleventyConfig.addPassthroughCopy("sw.js");
eleventyConfig.addPassthroughCopy("sitemap.xml");
eleventyConfig.addPassthroughCopy("robots.txt"); // if you have this too

  // Watch CSS for changes during dev
  eleventyConfig.addWatchTarget("css/");

  return {
    // Use Nunjucks for .html files (lets you use {% include %} etc.)
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",

    dir: {
      input:    ".",          // source root
      output:   "_site",      // build output
      includes: "_includes",  // partials like nav.html, footer.html
      layouts:  "_layouts",   // base.html, blog.html, etc.
      data:     "_data",      // global data files (optional)
    },

    // Don't process node_modules or the output folder
    pathPrefix: "/",
  };
};

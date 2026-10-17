import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isExternalWebLink,externalLinks} from './external-links.mjs';
const site='https://ken-25.github.io/generative-art-gallery/';
const page=site+'works/example/';
test('external Web links respect the public origin and gallery path boundary',()=>{
 for(const href of ['../../about/#terms','#main','?view=1','/generative-art-gallery/','/generative-art-gallery','https://ken-25.github.io/generative-art-gallery/works/a/','//ken-25.github.io/generative-art-gallery/','mailto:hello@example.org','tel:+123','blob:https://example.org/id','data:text/plain,hello','javascript:void(0)'])assert.equal(isExternalWebLink(href,page,site),false,href);
 for(const href of ['https://github.com/ken-25/generative-art-gallery','http://ken-25.github.io/generative-art-gallery/','//example.org/source','https://ken-25.github.io/another-gallery/','/generative-art-gallery-extra/','../../../other/'])assert.equal(isExternalWebLink(href,page,site),true,href);
 assert.equal(isExternalWebLink('/about/','https://example.org/works/a/','https://example.org/'),false);
 assert.equal(isExternalWebLink('https://[invalid',page,site),false);
});
test('external links gain a secure target and screen-reader notice without losing attributes',()=>{
 const input='<a HREF=\'https://example.org/?a=1&amp;b=2\' target="named" rel="ugc opener NOFOLLOW ugc" title="A &amp; B" aria-label="出典" class="source" data-value="a > b">source</a>';
 const html=externalLinks(input,page,site);
 assert.match(html,/HREF='https:\/\/example.org\/\?a=1&amp;b=2'/);
 assert.match(html,/target="_blank"/);assert.match(html,/rel="ugc nofollow noopener noreferrer"/);
 assert.match(html,/title="A &amp; B"/);assert.match(html,/aria-label="出典（新しいタブ）"/);
 assert.match(html,/class="source" data-value="a > b"/);assert.match(html,/source<span class="external-link-note">（新しいタブ）<\/span><\/a>/);
 assert.equal(externalLinks(html,page,site),html);
 const labeled=externalLinks(`<a href="https://example.org" title='A &copy; &eacute; &quot;B&quot;' aria-label='A &copy; &eacute;'>x</a>`,page,site);assert.match(labeled,/title='A &copy; &eacute; &quot;B&quot;'/);assert.match(labeled,/aria-label="A &copy; &eacute;（新しいタブ）"/);
 const internal='<a href="https://ken-25&period;github&period;io/generative-art-gallery/">home</a>';assert.equal(externalLinks(internal,page,site),internal);
 const upper=externalLinks('<A HREF="https&#58;//example.org" REL="noopener">x</A>',page,site);
 assert.doesNotMatch(upper,/title=/);assert.match(upper,/target="_blank"/);assert.match(upper,/rel="noopener noreferrer"/);
});
test('internal navigation, downloads, and non-Web links stay byte-identical',()=>{
 for(const input of ['<a href="../../about/">about</a>','<a href="#main">skip</a>','<a href="mailto:a@example.org">mail</a>','<a href="https://example.org/a.svg" download>save</a>','<a href="https://example.org/a.png" download="art.png">save</a>','<a href="blob:https://example.org/file">save</a>','<a name="anchor">anchor</a>'])assert.equal(externalLinks(input,page,site),input);
});
test('comments, raw-text elements, and encoded code samples are not transformed',()=>{
 const raw='<a href="https://example.org">not a document link</a>';
 const input=`<!-- ${raw} --><script>const s='${raw}';</script><style>/* ${raw} */</style><textarea>${raw}</textarea><title>${raw}</title><![CDATA[${raw}]]><pre>&lt;a href="https://example.org"&gt;</pre>`;
 assert.equal(externalLinks(input,page,site),input);
 const two=externalLinks('<a href="https://one.example"><strong>one</strong></a><a href="#two">two</a><a href="https://three.example">three</a>',page,site);
 assert.equal((two.match(/external-link-note/g)||[]).length,2);
});

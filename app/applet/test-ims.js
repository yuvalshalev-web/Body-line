import fs from 'fs';

async function test() {
  const response = await fetch("https://ims.gov.il/sites/default/files/ims_data/xml_files/isr_sea.xml");
  const buffer = await response.arrayBuffer();
  const decoder = new TextDecoder('windows-1255');
  const xml = decoder.decode(buffer);
  
  fs.writeFileSync('ims-output.txt', xml);
  console.log("Wrote to ims-output.txt");
}

test();

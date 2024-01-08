const fs = require("fs");

const extraTag = "Sea Of Stars";
const reposMeta = JSON.parse(fs.readFileSync("./meta.json", "utf8"));
const final = [];

async function recoverPlugin(internalName) {
  if (!fs.existsSync("./repo.json")) {
    console.error("!!! Tried to recover plugin when repo isn't generated");
    process.exit(1);
  }

  const oldRepo = JSON.parse(fs.readFileSync("./repo.json", "utf8"));
  let plugin = oldRepo.find((x) => x.InternalName === internalName);
  if (!plugin) {
    console.error(`!!! ${plugin} not found in old repo`);
    process.exit(1);
  }
  plugin = fixplugin(plugin);
  final.push(plugin);
  console.log(`Recovered ${internalName} from last manifest`);
}

async function doRepo(url, plugins) {
  console.log(`Fetching ${url}...`);
  const repo = await fetch(url, {
      headers: {
              'user-agent': 'SeaOfStars/1.0.0',
      },
  }).then((res) => res.json());

  for (const internalName of plugins) {
    let plugin = repo.find((x) => x.InternalName === internalName);
    if (!plugin) {
      console.warn(`!!! ${plugin} not found in ${url}`);
      recoverPlugin(internalName);
      continue;
    }

    // Inject our custom tag
    const tags = plugin.Tags || [];
    tags.push(extraTag);
    plugin.Tags = tags;

    plugin = fixplugin(plugin);
    final.push(plugin);
  }
}

async function fixplugin(plugin){
    if(plugin.internalName === "SimpleHeels"){
      plugin.IconUrl = "https://raw.githubusercontent.com/Murakumo-JP/SeaOfStars/main/icon/Simple%20Heels.png";
    }

    // Deletes the DownloadCount line
    if (plugin.DownloadCount !== undefined) {
      delete plugin.DownloadCount;
    }
    return plugin;
}

async function main() {
  for (const meta of reposMeta) {
    try {
      await doRepo(meta.repo, meta.plugins);
    } catch (e) {
      console.error(`!!! Failed to fetch ${meta.repo}`);
      console.error(e);
      for (const plugin of meta.plugins) {
        recoverPlugin(plugin);
      }
    }
  }

  fs.writeFileSync("./repo.json", JSON.stringify(final, null, 2));
  console.log(`Wrote ${final.length} plugins to repo.json.`);
}

main();

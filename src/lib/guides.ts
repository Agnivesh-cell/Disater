// DisasterGuard — Preparedness Center knowledge base (static content).
// Written in simple, plain language. Content is informational guidance only —
// always follow instructions from official emergency authorities.

export interface GuideSection {
  title: string;
  items: string[];
}
export interface Guide {
  slug: string;
  type: string; // DisasterType key
  title: string;
  emoji: string;
  summary: string;
  before: GuideSection;
  during: GuideSection;
  after: GuideSection;
  warningSigns: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: "flood-safety",
    type: "FLOOD",
    title: "Flood Safety",
    emoji: "🌊",
    summary: "How to prepare for, survive, and recover from flooding.",
    warningSigns: ["Heavy rain forecast for your area", "River water rising fast or turning muddy", "Water entering streets or drains overflowing", "Official flood watches or warnings issued"],
    before: {
      title: "Before a Flood",
      items: [
        "Know if your home is in a low-lying or flood-prone area.",
        "Prepare a go-bag: water, dry food, torch, power bank, medicines, and documents in a waterproof bag.",
        "Move important belongings and electrical items to higher floors or shelves.",
        "Decide your evacuation route and a safe meeting point with your family.",
        "Keep your phone charged and follow official weather updates.",
        "Learn how to switch off electricity, gas, and water at home.",
      ],
    },
    during: {
      title: "During a Flood",
      items: [
        "Move to higher ground immediately if you are in a low-lying area.",
        "Never walk, swim, or drive through moving floodwater — 15 cm of fast water can knock you down; 60 cm can float a car.",
        "Stay away from electric poles, wires, and transformers.",
        "Switch off electricity at the main switch if water enters your home and it is safe to do so.",
        "Listen to official alerts on radio, TV, or your phone. Follow evacuation orders immediately.",
        "If trapped on a rooftop, signal for help with a bright cloth — do not enter the water.",
      ],
    },
    after: {
      title: "After a Flood",
      items: [
        "Return home only when authorities say it is safe.",
        "Do not touch electrical equipment if it is wet or standing near water.",
        "Boil or treat all drinking water; throw away food touched by floodwater.",
        "Clean and disinfect everything that got wet — floodwater carries sewage and disease.",
        "Watch for snakes, insects, and damaged structures.",
        "Photograph damage for insurance and record losses for relief claims.",
      ],
    },
  },
  {
    slug: "earthquake-safety",
    type: "EARTHQUAKE",
    title: "Earthquake Safety",
    emoji: "🌎",
    summary: "Protect yourself when the ground shakes.",
    warningSigns: ["Sudden shaking or rolling of the ground", "Hanging objects swinging", "Rattling windows and crockery", "Animals behaving strangely (sometimes before tremors)"],
    before: {
      title: "Before an Earthquake",
      items: [
        "Secure heavy furniture, shelves, and water heaters to walls.",
        "Identify safe spots in each room: under strong tables, next to interior walls.",
        "Keep a go-bag with water, food, torch, medicines, and documents.",
        "Practice 'Drop, Cover, and Hold On' with your family.",
        "Know how to switch off gas and electricity.",
        "Avoid placing heavy objects above beds and sofas.",
      ],
    },
    during: {
      title: "During an Earthquake",
      items: [
        "DROP to your hands and knees before the shaking knocks you down.",
        "COVER your head and neck with your arms; get under a sturdy table if nearby.",
        "HOLD ON to your shelter until the shaking stops.",
        "Stay indoors — do not run outside during shaking; most injuries happen near doorways and on stairs.",
        "If outside, move away from buildings, trees, power lines, and streetlights.",
        "If driving, pull over in an open area, stay in the car with seatbelt on.",
      ],
    },
    after: {
      title: "After an Earthquake",
      items: [
        "Expect aftershocks — move carefully and check people near you for injuries.",
        "Check for gas leaks (smell of gas), sparks, or damaged wires; turn off the main supply if safe.",
        "Use text messages instead of calls to keep phone lines free for emergencies.",
        "Stay away from damaged buildings and broken glass.",
        "Listen to official updates; do not spread rumors.",
        "If near the coast and the shaking was long or strong, move inland and uphill — tsunamis can follow.",
      ],
    },
  },
  {
    slug: "cyclone-safety",
    type: "CYCLONE",
    title: "Cyclone Safety",
    emoji: "🌪",
    summary: "Get ready before the storm, stay safe through landfall.",
    warningSigns: ["Cyclone watch or warning issued for your coast", "Sea becoming rough, tide rising abnormally", "Continuous heavy rain and strengthening winds", "Sky turning greenish-black, pressure dropping"],
    before: {
      title: "Before a Cyclone",
      items: [
        "Track official cyclone advisories and know your evacuation center.",
        "Store drinking water — supply lines can fail for days.",
        "Trim dead branches; secure or bring in outdoor objects, signboards, and pots.",
        "Fix shutters or board up windows, especially glass doors.",
        "Keep a go-bag ready and fuel your vehicle or two-wheeler.",
        "Fishermen: do not venture to sea when warnings are issued.",
      ],
    },
    during: {
      title: "During a Cyclone",
      items: [
        "Stay indoors, away from windows and glass doors — shelter in the strongest room.",
        "If told to evacuate, leave early and go to the official shelter; do not wait for the storm to arrive.",
        "Keep a battery radio or phone updates on; the 'eye' of the cyclone is calm but the storm returns from the opposite direction.",
        "Do not go outside to 'check' the weather.",
        "Switch off electricity if flooding starts.",
        "Drink only stored/boiled water if supply is disrupted.",
      ],
    },
    after: {
      title: "After a Cyclone",
      items: [
        "Wait for the official 'all clear' before going outside.",
        "Beware of broken power lines, weakened trees, and damaged buildings.",
        "Do not enter sea water for fishing or swimming — the sea stays dangerous.",
        "Boil water and avoid street food until sanitation is confirmed safe.",
        "Report damages and casualties to local authorities or helpline 1078.",
        "Help neighbors who are elderly, disabled, or trapped.",
      ],
    },
  },
  {
    slug: "wildfire-safety",
    type: "WILDFIRE",
    title: "Wildfire Safety",
    emoji: "🔥",
    summary: "Prevent, escape, and recover from fires that spread fast.",
    warningSigns: ["Dry vegetation combined with heatwaves and strong wind", "Smell of smoke or visible haze", "Orange glow on hills at night", "Official fire danger ratings (extreme)"],
    before: {
      title: "Before Wildfire Season",
      items: [
        "Clear dry leaves, grass, and firewood at least 10 m around your house.",
        "Store matches, fuel, and chemicals away from living spaces.",
        "Prepare N95 masks to protect lungs from smoke.",
        "Plan two escape routes from your area.",
        "Keep hoses, buckets, and sand accessible for small spot fires.",
        "Never burn waste or light open fires during dry, windy days.",
      ],
    },
    during: {
      title: "During a Wildfire",
      items: [
        "Evacuate early if told to — fires move faster than people expect.",
        "Wear cotton/wool clothes (synthetics melt), cover nose and mouth with a mask or wet cloth.",
        "If trapped, go to a cleared open area or a building with no vegetation nearby; stay low where air is cleaner.",
        "Never try to outrun a fire uphill in thick vegetation — head downhill or crosswind.",
        "Call 101 (Fire) or 112 and give clear location details.",
        "Do not return for belongings once you have escaped.",
      ],
    },
    after: {
      title: "After a Wildfire",
      items: [
        "Return only when fire officials declare the area safe.",
        "Watch for hot spots, smoldering roots, and weakened trees.",
        "Check roofs and gutters for embers for several days.",
        "Discard food exposed to heat, smoke, or soot.",
        "Wear masks while cleaning ash; keep children away from burned areas.",
        "Report any re-ignition immediately — do not try to fight large fires yourself.",
      ],
    },
  },
  {
    slug: "lightning-safety",
    type: "LIGHTNING",
    title: "Lightning Safety",
    emoji: "⚡",
    summary: "Thunderstorms can kill — know where never to stand.",
    warningSigns: ["Dark growing clouds and distant thunder", "Sudden cool wind and large raindrops", "You can hear thunder — lightning is within striking range (10 km)"],
    before: {
      title: "Before Thunderstorm Season",
      items: [
        "Install lightning arresters on buildings where possible.",
        "Unplug sensitive electronics during storms.",
        "Learn the 30-30 rule: if thunder follows lightning within 30 seconds, stay sheltered for 30 minutes after the last thunder.",
        "Plan outdoor work (farming, fishing, construction) around weather forecasts.",
        "Teach children to go indoors at the first sound of thunder.",
      ],
    },
    during: {
      title: "During a Thunderstorm",
      items: [
        "Get inside a building or a hard-topped vehicle immediately.",
        "Avoid open fields, hilltops, tall trees, poles, and metal fences.",
        "In the open, crouch low on the balls of your feet — do NOT lie flat, and stay away from others (min 3 m apart).",
        "Stay off corded phones, computers, and plumbing; use mobile phones safely.",
        "If swimming or boating, get out of the water at the first sign of a storm.",
        "Wait 30 minutes after the last thunder before going back outside.",
      ],
    },
    after: {
      title: "After a Lightning Strike",
      items: [
        "Lightning victims carry no electric charge — give first aid immediately.",
        "Call 108 (ambulance) or 112; begin CPR if the person is not breathing.",
        "Check for burns, especially where current entered and exited the body.",
        "Move survivors to shelter — another strike can follow.",
        "Report strikes that injured people or cattle to local authorities.",
      ],
    },
  },
  {
    slug: "heatwave-safety",
    type: "HEATWAVE",
    title: "Heatwave Safety",
    emoji: "🌡",
    summary: "Stay cool, hydrated, and alert during extreme heat.",
    warningSigns: ["Temperatures 4.5°C+ above normal for your region", "Official heatwave alerts (yellow/orange/red)", "Dizziness, headache, nausea, or muscle cramps outdoors", "Very hot, dry nights that stop your body cooling"],
    before: {
      title: "Before Extreme Heat",
      items: [
        "Stock ORS (oral rehydration salts), electrolytes, and cooling items.",
        "Check fans, coolers, and AC; arrange cool rooms or shelters to visit.",
        "Plan outdoor activity before 10 AM or after 5 PM.",
        "Check on elderly neighbors, infants, outdoor workers, and pets.",
        "Learn the signs of heat cramps, heat exhaustion, and heat stroke.",
      ],
    },
    during: {
      title: "During a Heatwave",
      items: [
        "Drink water often — do not wait until you feel thirsty; avoid alcohol and very cold drinks.",
        "Stay indoors during peak hours; if outside, use an umbrella, hat, or wet cloth on the head.",
        "Wear loose, light-colored cotton clothes.",
        "Never leave children, elderly people, or pets in parked vehicles.",
        "If someone feels faint: move them to shade, loosen clothes, sponge with cool water, give ORS/water if conscious.",
        "Call 108 immediately for suspected heat stroke (hot dry skin, confusion, fainting) — it is life-threatening.",
      ],
    },
    after: {
      title: "After a Heatwave",
      items: [
        "Continue hydration — recovery takes time after heat illness.",
        "Watch for delayed symptoms in vulnerable people for 24–48 hours.",
        "Replace electrolytes after heavy sweating.",
        "Rest workers and reschedule outdoor shifts after extreme days.",
        "Check electricity and water supplies strained by the heat and report outages.",
      ],
    },
  },
  {
    slug: "landslide-safety",
    type: "LANDSLIDE",
    title: "Landslide Safety",
    emoji: "⛰",
    summary: "Recognize unstable slopes and react in seconds.",
    warningSigns: ["Cracks appearing on hillsides, roads, or house walls", "Bulging ground, tilting trees or fences", "Muddy or cloudy water flowing from slopes", "Sounds of cracking wood or rumbling earth"],
    before: {
      title: "Before / In Landslide-Prone Areas",
      items: [
        "Avoid building or cutting slopes during and right after heavy rain.",
        "Plant deep-rooted vegetation; build retaining walls and proper drainage on slopes.",
        "Watch for early signs: new cracks, leaning trees, seepage on slopes.",
        "Know the nearest safe high ground away from the slope.",
        "During heavy rain in hilly areas, keep bags packed if you live below an unstable slope.",
      ],
    },
    during: {
      title: "During a Landslide",
      items: [
        "Move quickly uphill or sideways away from the flow path — do not stop for belongings.",
        "Alert neighbors with loud shouts — seconds matter.",
        "If indoors on the slope side, move to upper floors and away from windows.",
        "If driving, watch for collapsed road edges, rocks, and mud on the carriageway; never drive through water covering a road on a slope.",
        "Listen for rumbling sounds — debris flows can accelerate suddenly.",
      ],
    },
    after: {
      title: "After a Landslide",
      items: [
        "Stay away from the slide area — further slides are common.",
        "Check for trapped or injured people nearby and call 112 / 1078.",
        "Avoid river valleys and low areas where debris flows may continue.",
        "Report blocked roads and damaged pipelines; do not try to clear large debris yourself.",
        "Get geotechnical advice before re-entering or repairing houses on slopes.",
      ],
    },
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

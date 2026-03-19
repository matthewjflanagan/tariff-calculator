import { useState, useMemo } from "react";

const C = {
  navy:       "#1B2A4A",
  navy2:      "#253D6B",
  gold:       "#C8A84B",
  goldLight:  "#F5E9C0",
  offWhite:   "#F8F6F0",
  lightGray:  "#E8E4DC",
  gray:       "#6B7280",
  green:      "#2E6B3E",
  greenLight: "#D4EDDA",
  red:        "#B82424",
  redLight:   "#FDEAEA",
  amber:      "#C77B0D",
  amberLight: "#FEF3DC",
  white:      "#FFFFFF",
  htext:      "#8BA0C0",
  teal:       "#1A5C6B",
};

// ── RATE BULLETIN ─────────────────────────────────────────────────────────────
// UPDATE THIS SECTION when rates change. This is the first thing users see.
const RATE_BULLETIN = {
  version: "v2.1",
  lastVerified: "March 19, 2026",
  alerts: [
    {
      level: "red",
      title: "Section 122 Global Baseline: 15%",
      body: "IEEPA tariffs struck down by Supreme Court on February 20, 2026. Trump invoked Section 122 of the Trade Act of 1974, imposing a 15% flat surcharge on most US imports effective February 22, 2026. Temporary for 150 days, expiring approximately July 24, 2026 unless Congress extends it. USMCA-qualifying goods and Section 232 products are exempt.",
    },
    {
      level: "amber",
      title: "Section 301 on China and Section 232 Remain in Full Effect",
      body: "The SCOTUS ruling did not affect Section 301 tariffs on Chinese goods or Section 232 tariffs on steel, aluminum, copper, lumber, automobiles, and semiconductors. These continue to stack on top of the Section 122 baseline.",
    },
    {
      level: "green",
      title: "IEEPA Refunds Pending for 2025 Payments",
      body: "Importers who paid IEEPA tariffs in 2025 may be entitled to refunds. CBP is developing a refund process through the ACE customs system. Consult your customs broker for status.",
    },
  ],
  sources: [
    { label: "USITC HTS Schedule", url: "https://hts.usitc.gov" },
    { label: "USTR Tariff Actions", url: "https://ustr.gov/issue-areas/enforcement/section-301-investigations/tariff-actions" },
    { label: "CBP Import Guidance", url: "https://www.cbp.gov/trade/programs-administration/entry-summary/tariff-section-232-steel-aluminum" },
    { label: "Trade Compliance Resource Hub", url: "https://www.tradecomplianceresourcehub.com" },
  ],
};

// ── HTS CHAPTER DATABASE ──────────────────────────────────────────────────────
const HTS = {
  "01":{ s:"I",    d:"Live Animals",                         ml:0,  mh:2.4,  c:false, cr:0,   s2:false, s2r:0,  n:"Most live animals enter duty free." },
  "02":{ s:"I",    d:"Meat and Edible Meat Offal",           ml:0,  mh:26.4, c:false, cr:0,   s2:false, s2r:0,  n:"Beef 26.4%, pork typically free." },
  "03":{ s:"I",    d:"Fish and Seafood",                     ml:0,  mh:15,   c:false, cr:0,   s2:false, s2r:0,  n:"Most fish 0% to 3.5%." },
  "04":{ s:"I",    d:"Dairy, Eggs, Honey",                   ml:0,  mh:23.7, c:false, cr:0,   s2:false, s2r:0,  n:"Cheese and butter can carry high rates." },
  "05":{ s:"I",    d:"Other Animal Products",                ml:0,  mh:5,    c:false, cr:0,   s2:false, s2r:0,  n:"Generally low." },
  "06":{ s:"II",   d:"Live Plants and Cut Flowers",          ml:0,  mh:6.8,  c:false, cr:0,   s2:false, s2r:0,  n:"Cut flowers 6.8%, plants often free." },
  "07":{ s:"II",   d:"Vegetables",                           ml:0,  mh:20.7, c:false, cr:0,   s2:false, s2r:0,  n:"Most 0% to 14.9%." },
  "08":{ s:"II",   d:"Fruit and Nuts",                       ml:0,  mh:17.6, c:false, cr:0,   s2:false, s2r:0,  n:"Most fresh fruit 0% to 6%." },
  "09":{ s:"II",   d:"Coffee, Tea, Spices",                  ml:0,  mh:6.4,  c:false, cr:0,   s2:false, s2r:0,  n:"Coffee free, some spices 6.4%." },
  "10":{ s:"II",   d:"Cereals",                              ml:0,  mh:0.65, c:false, cr:0,   s2:false, s2r:0,  n:"Mostly free." },
  "11":{ s:"II",   d:"Milling Products, Starch",             ml:0,  mh:8.5,  c:false, cr:0,   s2:false, s2r:0,  n:"Flour and starches generally low." },
  "12":{ s:"II",   d:"Oil Seeds, Industrial Plants",         ml:0,  mh:8.8,  c:false, cr:0,   s2:false, s2r:0,  n:"Soybeans free." },
  "13":{ s:"II",   d:"Lac, Gums, Resins",                    ml:0,  mh:3.7,  c:false, cr:0,   s2:false, s2r:0,  n:"Generally low." },
  "14":{ s:"II",   d:"Vegetable Plaiting Materials",         ml:0,  mh:3.9,  c:false, cr:0,   s2:false, s2r:0,  n:"Low rates." },
  "15":{ s:"III",  d:"Animal and Vegetable Fats, Oils",      ml:0,  mh:8.8,  c:false, cr:0,   s2:false, s2r:0,  n:"Most vegetable oils free." },
  "16":{ s:"IV",   d:"Preparations of Meat or Fish",         ml:0,  mh:11.2, c:false, cr:0,   s2:false, s2r:0,  n:"Canned goods 5% to 11%." },
  "17":{ s:"IV",   d:"Sugar and Confectionery",              ml:0,  mh:39.9, c:false, cr:0,   s2:false, s2r:0,  n:"Raw sugar high rates up to 39.9%." },
  "18":{ s:"IV",   d:"Cocoa and Chocolate",                  ml:0,  mh:7.7,  c:false, cr:0,   s2:false, s2r:0,  n:"Chocolate typically 5% to 7.7%." },
  "19":{ s:"IV",   d:"Cereals and Food Preparations",        ml:0,  mh:10,   c:false, cr:0,   s2:false, s2r:0,  n:"Bread, pasta typically 0% to 10%." },
  "20":{ s:"IV",   d:"Vegetable Preparations",               ml:0,  mh:13.9, c:false, cr:0,   s2:false, s2r:0,  n:"Canned vegetables typically 6% to 14%." },
  "21":{ s:"IV",   d:"Miscellaneous Food Preparations",      ml:0,  mh:10.2, c:false, cr:0,   s2:false, s2r:0,  n:"Sauces, soups, condiments." },
  "22":{ s:"IV",   d:"Beverages, Spirits, Vinegar",          ml:0,  mh:6.3,  c:false, cr:0,   s2:false, s2r:0,  n:"Beer free, wine 6.3%." },
  "23":{ s:"IV",   d:"Animal Feed Residues",                 ml:0,  mh:1.4,  c:false, cr:0,   s2:false, s2r:0,  n:"Mostly free." },
  "24":{ s:"IV",   d:"Tobacco",                              ml:0,  mh:350,  c:false, cr:0,   s2:false, s2r:0,  n:"Complex rate structure for cigarettes." },
  "25":{ s:"V",    d:"Salt, Sulfur, Stone, Cement",          ml:0,  mh:3.7,  c:false, cr:0,   s2:false, s2r:0,  n:"Generally free to low." },
  "26":{ s:"V",    d:"Ores, Slag, Ash",                      ml:0,  mh:2.6,  c:false, cr:0,   s2:false, s2r:0,  n:"Most free." },
  "27":{ s:"V",    d:"Mineral Fuels, Oil, Gas",              ml:0,  mh:5.25, c:false, cr:0,   s2:false, s2r:0,  n:"Crude oil free, refined products low." },
  "28":{ s:"VI",   d:"Inorganic Chemicals",                  ml:0,  mh:5.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25% for most from China." },
  "29":{ s:"VI",   d:"Organic Chemicals",                    ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25% broadly applies." },
  "30":{ s:"VI",   d:"Pharmaceutical Products",              ml:0,  mh:6.5,  c:false, cr:0,   s2:false, s2r:0,  n:"Most pharma free under WTO. Section 301 generally does not apply." },
  "31":{ s:"VI",   d:"Fertilizers",                          ml:0,  mh:5,    c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "32":{ s:"VI",   d:"Tanning, Dyeing, Paints, Varnishes",   ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "33":{ s:"VI",   d:"Essential Oils, Cosmetics",            ml:0,  mh:6.5,  c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5% (List 3)." },
  "34":{ s:"VI",   d:"Soap, Waxes, Lubricants",              ml:0,  mh:5.8,  c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "35":{ s:"VI",   d:"Albuminoidal Substances, Enzymes",     ml:0,  mh:6.3,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "36":{ s:"VI",   d:"Explosives, Matches, Pyrotechnics",    ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "37":{ s:"VI",   d:"Photographic Film",                    ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "38":{ s:"VI",   d:"Miscellaneous Chemical Products",      ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "39":{ s:"VII",  d:"Plastics and Articles Thereof",        ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "40":{ s:"VII",  d:"Rubber and Articles Thereof",          ml:0,  mh:10,   c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "41":{ s:"VIII", d:"Hides, Skins, Leather",                ml:0,  mh:5,    c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "42":{ s:"VIII", d:"Leather Articles, Handbags",           ml:0,  mh:20,   c:true,  cr:7.5, s2:false, s2r:0,  n:"Handbags up to 20% MFN. Section 301 at 7.5%." },
  "43":{ s:"VIII", d:"Furskins and Fur Products",            ml:0,  mh:8.5,  c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "44":{ s:"IX",   d:"Wood and Wood Articles",               ml:0,  mh:10,   c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%. Some lumber subject to Section 232." },
  "45":{ s:"IX",   d:"Cork and Cork Articles",               ml:0,  mh:18,   c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "46":{ s:"IX",   d:"Straw, Esparto, Basketware",           ml:0,  mh:8.4,  c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "47":{ s:"X",    d:"Pulp of Wood",                         ml:0,  mh:0,    c:false, cr:0,   s2:false, s2r:0,  n:"Mostly free." },
  "48":{ s:"X",    d:"Paper and Paperboard",                 ml:0,  mh:6,    c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "49":{ s:"X",    d:"Printed Books, Newspapers, Maps",      ml:0,  mh:0,    c:false, cr:0,   s2:false, s2r:0,  n:"Mostly free." },
  "50":{ s:"XI",   d:"Silk",                                 ml:0,  mh:11,   c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "51":{ s:"XI",   d:"Wool and Animal Hair",                 ml:0,  mh:37.5, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "52":{ s:"XI",   d:"Cotton",                               ml:0,  mh:21,   c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "53":{ s:"XI",   d:"Other Vegetable Textile Fibers",       ml:0,  mh:11,   c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "54":{ s:"XI",   d:"Man-Made Filaments",                   ml:0,  mh:14.9, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "55":{ s:"XI",   d:"Man-Made Staple Fibers",               ml:0,  mh:15.1, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "56":{ s:"XI",   d:"Wadding, Felt, Nonwovens",             ml:0,  mh:14,   c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "57":{ s:"XI",   d:"Carpets and Floor Coverings",          ml:0,  mh:13.6, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "58":{ s:"XI",   d:"Special Woven Fabrics",                ml:0,  mh:15.1, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "59":{ s:"XI",   d:"Impregnated Textile Fabrics",          ml:0,  mh:14.9, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "60":{ s:"XI",   d:"Knitted or Crocheted Fabrics",         ml:0,  mh:15.1, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "61":{ s:"XI",   d:"Knitted Apparel",                      ml:0,  mh:32,   c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%. MFN up to 32%." },
  "62":{ s:"XI",   d:"Woven Apparel",                        ml:0,  mh:28.6, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "63":{ s:"XI",   d:"Other Made-Up Textile Articles",       ml:0,  mh:14.9, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "64":{ s:"XII",  d:"Footwear",                             ml:0,  mh:67.5, c:true,  cr:7.5, s2:false, s2r:0,  n:"MFN up to 67.5%. Section 301 at 7.5%." },
  "65":{ s:"XII",  d:"Headgear",                             ml:0,  mh:27.5, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "66":{ s:"XII",  d:"Umbrellas, Walking Sticks",            ml:0,  mh:8.2,  c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "67":{ s:"XII",  d:"Feathers, Artificial Flowers, Wigs",   ml:0,  mh:6.1,  c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "68":{ s:"XIII", d:"Stone, Plaster, Cement Articles",      ml:0,  mh:9,    c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "69":{ s:"XIII", d:"Ceramic Products",                     ml:0,  mh:28,   c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%. Tile up to 28%." },
  "70":{ s:"XIII", d:"Glass and Glassware",                  ml:0,  mh:38.3, c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "71":{ s:"XIV",  d:"Precious Metals, Jewelry, Coins",      ml:0,  mh:13.5, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%. Gold generally free." },
  "72":{ s:"XV",   d:"Iron and Steel",                       ml:0,  mh:6.5,  c:true,  cr:25,  s2:true,  s2r:50, n:"Section 232 at 50% on steel. Section 301 at 25% from China. Section 122 does NOT stack with Section 232." },
  "73":{ s:"XV",   d:"Iron or Steel Articles",               ml:0,  mh:11.5, c:true,  cr:25,  s2:true,  s2r:50, n:"Steel derivative. Section 232 at 50% applies. Section 122 does NOT stack with Section 232." },
  "74":{ s:"XV",   d:"Copper and Copper Articles",           ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%. Copper under separate Section 232 investigation." },
  "75":{ s:"XV",   d:"Nickel and Nickel Articles",           ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "76":{ s:"XV",   d:"Aluminum and Aluminum Articles",       ml:0,  mh:6.5,  c:true,  cr:25,  s2:true,  s2r:50, n:"Section 232 at 50% on aluminum. Section 301 at 25% from China. Section 122 does NOT stack with Section 232." },
  "78":{ s:"XV",   d:"Lead and Lead Articles",               ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "79":{ s:"XV",   d:"Zinc and Zinc Articles",               ml:0,  mh:5.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "80":{ s:"XV",   d:"Tin and Tin Articles",                 ml:0,  mh:3,    c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "81":{ s:"XV",   d:"Other Base Metals, Cermets",           ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "82":{ s:"XV",   d:"Tools, Cutlery of Base Metal",         ml:0,  mh:12,   c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "83":{ s:"XV",   d:"Miscellaneous Base Metal Articles",    ml:0,  mh:8,    c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "84":{ s:"XVI",  d:"Machinery, Boilers, Nuclear Reactors", ml:0,  mh:6,    c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%. Exclusions available for manufacturing equipment. HTS 8541/8542 semiconductors at 50%." },
  "85":{ s:"XVI",  d:"Electrical Machinery, Electronics",    ml:0,  mh:6,    c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25% for most. Some consumer electronics at 7.5%. Semiconductors (8541/8542) at 50%. EVs at 100%." },
  "86":{ s:"XVII", d:"Railway Equipment",                    ml:0,  mh:6.5,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "87":{ s:"XVII", d:"Vehicles (not railway)",               ml:0,  mh:25,   c:true,  cr:25,  s2:false, s2r:0,  n:"Autos 2.5% MFN. Section 232 at 25% on autos/parts. EVs from China at 100%. Section 122 does NOT stack with Section 232." },
  "88":{ s:"XVII", d:"Aircraft and Spacecraft",              ml:0,  mh:5,    c:true,  cr:25,  s2:false, s2r:0,  n:"Civil aircraft often free. Section 301 at 25%." },
  "89":{ s:"XVII", d:"Ships and Boats",                      ml:0,  mh:3.4,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "90":{ s:"XVIII",d:"Optical, Medical, Measuring Instruments",ml:0,mh:6.7,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%. Syringes/needles at 100%." },
  "91":{ s:"XVIII",d:"Clocks and Watches",                   ml:0,  mh:7.6,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "92":{ s:"XVIII",d:"Musical Instruments",                  ml:0,  mh:4.9,  c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "93":{ s:"XIX",  d:"Arms and Ammunition",                  ml:0,  mh:6.8,  c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%." },
  "94":{ s:"XX",   d:"Furniture, Bedding, Lighting",         ml:0,  mh:7,    c:true,  cr:25,  s2:false, s2r:0,  n:"Section 301 at 25%. Upholstered furniture subject to Section 232 investigation." },
  "95":{ s:"XX",   d:"Toys, Games, Sports Equipment",        ml:0,  mh:14.6, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5% (List 3/4A)." },
  "96":{ s:"XX",   d:"Miscellaneous Manufactured Articles",  ml:0,  mh:11.6, c:true,  cr:7.5, s2:false, s2r:0,  n:"Section 301 at 7.5%." },
  "97":{ s:"XXI",  d:"Works of Art, Antiques",               ml:0,  mh:6.6,  c:false, cr:0,   s2:false, s2r:0,  n:"Original works generally free." },
  "98":{ s:"XXI",  d:"Special Classification Provisions",    ml:0,  mh:0,    c:false, cr:0,   s2:false, s2r:0,  n:"Goods returned, duty free imports." },
  "99":{ s:"XXI",  d:"Temporary and Special Tariff Programs",ml:0,  mh:0,    c:false, cr:0,   s2:false, s2r:0,  n:"Tariff exclusions and special provisions." },
};

// ── COUNTRY DATABASE ──────────────────────────────────────────────────────────
// All baselines updated to reflect Section 122 at 15% as of Feb 22, 2026
// s122 = whether Section 122 15% baseline applies
// s122_exempt = whether excluded from Section 122 (USMCA, Section 232 products)
const COUNTRIES = {
  // ASIA PACIFIC
  "china":       { l:"China",           f:"🇨🇳", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Section 301 (7.5% to 50%) and Section 232 stack on top. IEEPA struck down Feb 2026. China faces highest overall tariff burden." },
  "vietnam":     { l:"Vietnam",         f:"🇻🇳", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously faced 46% IEEPA rate. Significant relief post-SCOTUS ruling. Major China+1 alternative." },
  "india":       { l:"India",           f:"🇮🇳", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 50% (IEEPA), reduced to 18% in Feb 2026 deal, then IEEPA struck down. Now at MFN plus 15% Section 122. Deal framework still being finalized." },
  "taiwan":      { l:"Taiwan",          f:"🇹🇼", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Critical semiconductor supply chain. No Section 301." },
  "southkorea":  { l:"South Korea",     f:"🇰🇷", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 25% IEEPA rate." },
  "japan":       { l:"Japan",           f:"🇯🇵", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-Japan deal framework at 15% aligns with current rate." },
  "indonesia":   { l:"Indonesia",       f:"🇮🇩", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 32% IEEPA rate." },
  "thailand":    { l:"Thailand",        f:"🇹🇭", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 36% IEEPA rate." },
  "malaysia":    { l:"Malaysia",        f:"🇲🇾", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 24% IEEPA rate." },
  "philippines": { l:"Philippines",     f:"🇵🇭", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 17% IEEPA rate." },
  "bangladesh":  { l:"Bangladesh",      f:"🇧🇩", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Major apparel exporter. Previously 37% IEEPA rate." },
  "cambodia":    { l:"Cambodia",        f:"🇰🇭", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 49% IEEPA rate. Solar panels subject to CVD up to 3521%." },
  "pakistan":    { l:"Pakistan",        f:"🇵🇰", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Textiles and apparel." },
  "srilanka":    { l:"Sri Lanka",       f:"🇱🇰", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Apparel." },
  "australia":   { l:"Australia",       f:"🇦🇺", r:"Asia Pacific",  b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 25% IEEPA rate." },
  // NORTH AMERICA
  "canada":      { l:"Canada",          f:"🇨🇦", r:"North America", b:0,   usmca:true,  s122:false, n:"USMCA-qualifying goods duty free and exempt from Section 122. Non-qualifying goods face 25% tariff. 85% of Canadian imports claiming USMCA exemption as of Jan 2026." },
  "mexico":      { l:"Mexico",          f:"🇲🇽", r:"North America", b:0,   usmca:true,  s122:false, n:"USMCA-qualifying goods duty free and exempt from Section 122. Non-qualifying goods face 25% tariff. Verify rules of origin." },
  // EUROPE
  "germany":     { l:"Germany",         f:"🇩🇪", r:"Europe",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-EU deal framework at 15% aligns with current rate." },
  "france":      { l:"France",          f:"🇫🇷", r:"Europe",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-EU deal framework." },
  "italy":       { l:"Italy",           f:"🇮🇹", r:"Europe",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-EU deal framework." },
  "spain":       { l:"Spain",           f:"🇪🇸", r:"Europe",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-EU deal framework." },
  "netherlands": { l:"Netherlands",     f:"🇳🇱", r:"Europe",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-EU deal framework." },
  "poland":      { l:"Poland",          f:"🇵🇱", r:"Europe",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-EU deal framework." },
  "sweden":      { l:"Sweden",          f:"🇸🇪", r:"Europe",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-EU deal framework." },
  "uk":          { l:"United Kingdom",  f:"🇬🇧", r:"Europe",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Steel 25% Section 232 (UK partial exemption from 50%). Previously under separate US-UK framework." },
  "switzerland": { l:"Switzerland",     f:"🇨🇭", r:"Europe",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 31% IEEPA rate." },
  // AMERICAS
  "brazil":      { l:"Brazil",          f:"🇧🇷", r:"Americas",      b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 50% tariff effective Aug 2025 under IEEPA which has been struck down." },
  "colombia":    { l:"Colombia",        f:"🇨🇴", r:"Americas",      b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-Colombia FTA may provide relief for qualifying goods." },
  "chile":       { l:"Chile",           f:"🇨🇱", r:"Americas",      b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-Chile FTA may provide relief." },
  "peru":        { l:"Peru",            f:"🇵🇪", r:"Americas",      b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-Peru FTA may provide relief." },
  // MIDDLE EAST
  "israel":      { l:"Israel",          f:"🇮🇱", r:"Middle East",   b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. US-Israel FTA may provide relief for qualifying goods." },
  "turkey":      { l:"Turkey",          f:"🇹🇷", r:"Middle East",   b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline." },
  "uae":         { l:"UAE",             f:"🇦🇪", r:"Middle East",   b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline." },
  "saudiarabia": { l:"Saudi Arabia",    f:"🇸🇦", r:"Middle East",   b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline." },
  // AFRICA
  "southafrica": { l:"South Africa",    f:"🇿🇦", r:"Africa",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline. Previously 30% IEEPA rate." },
  "egypt":       { l:"Egypt",           f:"🇪🇬", r:"Africa",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline." },
  "nigeria":     { l:"Nigeria",         f:"🇳🇬", r:"Africa",        b:15,  usmca:false, s122:true,  n:"Section 122 15% baseline." },
  // OTHER
  "other":       { l:"Other Country",   f:"🌍",  r:"Other",         b:15,  usmca:false, s122:true,  n:"Default Section 122 15% global baseline. Enter your specific rates on Tab 2." },
};

const REGIONS = ["Asia Pacific", "North America", "Europe", "Americas", "Middle East", "Africa", "Other"];
const RAG_COLORS = { red: C.red, amber: C.amber, green: C.green };
const RAG_BG = { red: C.redLight, amber: C.amberLight, green: C.greenLight };

const parse = (v) => { const n = parseFloat(String(v).replace(/[^0-9.]/g,"")); return isNaN(n) ? 0 : n; };
const fmt = (n, d=2) => "$" + Number(n).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const fmtPct = (n) => Number(n).toFixed(2) + "%";

export default function TariffCalculator() {
  const [activeTab, setActiveTab]       = useState("product");
  const [showBulletin, setShowBulletin] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState("china");
  const [countrySearch, setCountrySearch]     = useState("");
  const [activeRegion, setActiveRegion]       = useState("Asia Pacific");
  const [htsInput, setHtsInput]         = useState("");
  const [htsSuggestion, setHtsSuggestion] = useState(null);
  const [productValue, setProductValue] = useState("");
  const [quantity, setQuantity]         = useState("");
  const [freightCost, setFreightCost]   = useState("");
  const [insuranceRate, setInsuranceRate] = useState("0.5");
  const [brokerFee, setBrokerFee]       = useState("175");
  const [customsBond, setCustomsBond]   = useState("50");
  const [otherFees, setOtherFees]       = useState("");
  const [mnfRate, setMnfRate]           = useState("3.5");
  const [baselineRate, setBaselineRate] = useState("15");
  const [section301Rate, setSection301Rate] = useState("0");
  const [section232Rate, setSection232Rate] = useState("0");
  const [customTariff, setCustomTariff] = useState("0");
  const [showRateGuide, setShowRateGuide] = useState(false);

  const country = COUNTRIES[selectedCountry];

  const lookupHTS = (val) => {
    setHtsInput(val);
    const chapter = val.replace(/[.\s]/g,"").slice(0,2);
    if (chapter.length === 2 && HTS[chapter]) {
      const ch = HTS[chapter];
      setHtsSuggestion({ chapter, ...ch });
      const midMnf = ch.mh < 1 ? ch.mh : ((ch.ml + ch.mh) / 2);
      setMnfRate(midMnf.toFixed(1));
      if (selectedCountry === "china" && ch.c) setSection301Rate(String(ch.cr));
      if (ch.s2) setSection232Rate(String(ch.s2r));
    } else {
      setHtsSuggestion(null);
    }
  };

  const applyCountry = (key) => {
    const c = COUNTRIES[key];
    setSelectedCountry(key);
    setBaselineRate(String(c.b));
    if (key !== "china") setSection301Rate("0");
    if (htsSuggestion && key === "china" && htsSuggestion.c) {
      setSection301Rate(String(htsSuggestion.cr));
    }
    if (htsSuggestion?.s2) setSection232Rate(String(htsSuggestion.s2r));
  };

  const calc = useMemo(() => {
    const val     = parse(productValue);
    const qty     = parse(quantity) || 1;
    const freight = parse(freightCost);
    const ins     = val * (parse(insuranceRate) / 100);
    const broker  = parse(brokerFee);
    const bond    = parse(customsBond);
    const other   = parse(otherFees);
    const cifVal  = val + freight + ins;
    const mnf     = parse(mnfRate) / 100;
    const base    = parse(baselineRate) / 100;
    const s301    = parse(section301Rate) / 100;
    const s232    = parse(section232Rate) / 100;
    const cust    = parse(customTariff) / 100;
    if (val === 0) return null;
    const mnfDuty  = cifVal * mnf;
    const baseDuty = cifVal * base;
    const s301Duty = cifVal * s301;
    const s232Duty = cifVal * s232;
    const custDuty = cifVal * cust;
    const totalDuty = mnfDuty + baseDuty + s301Duty + s232Duty + custDuty;
    const totalTariffPct = (mnf + base + s301 + s232 + cust) * 100;
    const totalLanded = val + freight + ins + totalDuty + broker + bond + other;
    return {
      val, qty, freight, ins, cifVal,
      mnfDuty, baseDuty, s301Duty, s232Duty, custDuty,
      totalDuty, totalTariffPct,
      broker, bond, other, totalLanded,
      perUnit: qty > 1 ? totalLanded / qty : null,
      effDutyPct: val > 0 ? (totalDuty / val) * 100 : 0,
      multiplier: val > 0 ? totalLanded / val : 1,
    };
  }, [productValue, quantity, freightCost, insuranceRate, brokerFee, customsBond, otherFees,
      mnfRate, baselineRate, section301Rate, section232Rate, customTariff]);

  const filteredCountries = Object.entries(COUNTRIES).filter(([k, c]) => {
    const matchRegion = activeRegion === "All" || c.r === activeRegion;
    const matchSearch = countrySearch === "" || c.l.toLowerCase().includes(countrySearch.toLowerCase());
    return matchRegion && matchSearch;
  });

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:C.offWhite, minHeight:"100vh", color:C.navy }}>

      {/* Header */}
      <div style={{ background:C.navy, borderBottom:`3px solid ${C.gold}`, padding:"16px 16px 12px" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontSize:18, fontWeight:"bold", color:C.white, letterSpacing:1 }}>US IMPORT TARIFF</span>
          <span style={{ fontSize:10, color:C.gold, fontFamily:"sans-serif", letterSpacing:2, fontWeight:"bold" }}>AND LANDED COST CALCULATOR</span>
        </div>
        <div style={{ fontSize:10, color:C.htext, marginTop:3, fontFamily:"sans-serif" }}>
          Matthew Flanagan, CPSM · Flanagan Sourcing Intelligence Portfolio · {RATE_BULLETIN.version} · Rates verified {RATE_BULLETIN.lastVerified}
        </div>
      </div>

      {/* Rate Bulletin */}
      {showBulletin && (
        <div style={{ background:C.navy2, borderBottom:`2px solid ${C.gold}`, padding:"12px 16px" }}>
          <div style={{ maxWidth:800, margin:"0 auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:11, color:C.gold, fontFamily:"sans-serif", fontWeight:"bold", letterSpacing:2 }}>
                RATE BULLETIN — {RATE_BULLETIN.lastVerified}
              </div>
              <button onClick={() => setShowBulletin(false)} style={{ background:"none", border:`1px solid ${C.htext}`, borderRadius:3, padding:"2px 8px", fontSize:10, color:C.htext, fontFamily:"sans-serif", cursor:"pointer" }}>
                Dismiss
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {RATE_BULLETIN.alerts.map((alert, i) => (
                <div key={i} style={{ background:RAG_BG[alert.level], border:`1px solid ${RAG_COLORS[alert.level]}`, borderRadius:4, padding:"8px 12px" }}>
                  <div style={{ fontSize:11, fontWeight:"bold", color:RAG_COLORS[alert.level], fontFamily:"sans-serif", marginBottom:3 }}>{alert.title}</div>
                  <div style={{ fontSize:11, color:C.navy, fontFamily:"sans-serif", lineHeight:1.5 }}>{alert.body}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, display:"flex", gap:12, flexWrap:"wrap" }}>
              {RATE_BULLETIN.sources.map((src, i) => (
                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize:10, color:C.gold, fontFamily:"sans-serif" }}>
                  {src.label} →
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showBulletin && (
        <div style={{ background:C.amberLight, borderBottom:`1px solid ${C.amber}`, padding:"6px 16px", cursor:"pointer" }} onClick={() => setShowBulletin(true)}>
          <div style={{ maxWidth:800, margin:"0 auto", fontSize:11, color:C.amber, fontFamily:"sans-serif" }}>
            ⚠ Rates verified {RATE_BULLETIN.lastVerified} · Section 122 15% global baseline currently in effect · Click to show Rate Bulletin · Always verify at hts.usitc.gov
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background:C.navy2, borderBottom:`2px solid ${C.gold}`, overflowX:"auto" }}>
        <div style={{ display:"flex", minWidth:"max-content" }}>
          {[
            {key:"product", label:"1. HTS and Country"},
            {key:"tariffs", label:"2. Tariff Rates"},
            {key:"costs",   label:"3. Other Costs"},
            {key:"results", label:"4. Landed Cost"},
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background:activeTab===tab.key?C.gold:"transparent",
              color:activeTab===tab.key?C.navy:C.htext,
              border:"none", padding:"10px 16px", fontSize:12,
              fontFamily:"sans-serif", fontWeight:"bold", letterSpacing:1,
              cursor:"pointer", whiteSpace:"nowrap",
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"16px 16px 48px", maxWidth:800, margin:"0 auto" }}>

        {/* ── TAB 1 ── */}
        {activeTab==="product" && (
          <div>
            <InfoBox>
              This calculator estimates the total landed cost of goods being <strong>imported into the United States</strong>. Select the country where your product is manufactured, look up the HTS chapter for your product, and the tool will pre-fill the applicable US import tariff rates.
            </InfoBox>

            {/* HTS Lookup */}
            <Card title="HTS Chapter Lookup" subtitle="Enter the first 2 digits of your HTS code to identify your product category and typical rates. Look up the full 10-digit code at hts.usitc.gov.">
              <div style={{ marginBottom:12 }}>
                <FieldLabel>HTS Chapter (first 2 digits)</FieldLabel>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <input value={htsInput} onChange={e => lookupHTS(e.target.value)}
                    placeholder="e.g. 84, 85, 62, 72..."
                    maxLength={10} style={{ ...inputSt, maxWidth:180 }} />
                  <a href="https://hts.usitc.gov" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, color:C.navy, fontFamily:"sans-serif", textDecoration:"underline" }}>
                    Look up full 10-digit HTS code →
                  </a>
                </div>
              </div>

              {htsSuggestion && (
                <div style={{ background:C.greenLight, border:`1px solid ${C.green}`, borderRadius:4, padding:"12px 14px", marginBottom:12 }}>
                  <div style={{ fontSize:11, color:C.green, fontFamily:"sans-serif", fontWeight:"bold", letterSpacing:1, marginBottom:6 }}>
                    CHAPTER {htsSuggestion.chapter} — {htsSuggestion.d}
                  </div>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:6 }}>
                    <span style={{ fontSize:12, fontFamily:"sans-serif", color:C.gray }}>MFN range: <strong style={{ color:C.navy }}>{htsSuggestion.ml}% to {htsSuggestion.mh}%</strong></span>
                    <span style={{ fontSize:12, fontFamily:"sans-serif", color:htsSuggestion.c?C.red:C.green }}>Section 301: <strong>{htsSuggestion.c?`${htsSuggestion.cr}% (China)`:"Does not apply"}</strong></span>
                    <span style={{ fontSize:12, fontFamily:"sans-serif", color:htsSuggestion.s2?C.amber:C.gray }}>Section 232: <strong>{htsSuggestion.s2?`${htsSuggestion.s2r}%`:"Does not apply"}</strong></span>
                  </div>
                  <div style={{ fontSize:11, color:C.gray, fontFamily:"sans-serif" }}>{htsSuggestion.n}</div>
                  <div style={{ marginTop:6, fontSize:11, color:C.green, fontFamily:"sans-serif", fontWeight:"bold" }}>✓ Rates pre-filled on Tab 2. Review before calculating.</div>
                </div>
              )}

              {/* Chapter browser */}
              <FieldLabel>Browse all 99 chapters:</FieldLabel>
              <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, fontFamily:"sans-serif", minWidth:380 }}>
                  <thead>
                    <tr style={{ background:C.navy }}>
                      <th style={{ padding:"6px 8px", textAlign:"left", color:C.white, fontSize:10 }}>CH</th>
                      <th style={{ padding:"6px 8px", textAlign:"left", color:C.white, fontSize:10 }}>DESCRIPTION</th>
                      <th style={{ padding:"6px 8px", textAlign:"center", color:C.gold, fontSize:10 }}>MFN RANGE</th>
                      <th style={{ padding:"6px 8px", textAlign:"center", color:C.white, fontSize:10 }}>S301</th>
                      <th style={{ padding:"6px 8px", textAlign:"center", color:C.white, fontSize:10 }}>S232</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(HTS).map(([ch, d], i) => (
                      <tr key={ch} onClick={() => lookupHTS(ch)}
                        style={{ background:htsSuggestion?.chapter===ch?C.goldLight:i%2===0?C.white:"#F2EFE8", cursor:"pointer" }}>
                        <td style={{ padding:"5px 8px", fontWeight:"bold", color:C.navy }}>{ch}</td>
                        <td style={{ padding:"5px 8px", color:C.navy }}>{d.d}</td>
                        <td style={{ padding:"5px 8px", textAlign:"center", color:C.gray }}>{d.ml}–{d.mh}%</td>
                        <td style={{ padding:"5px 8px", textAlign:"center", color:d.c?C.red:C.gray, fontWeight:d.c?"bold":"normal" }}>{d.c?`${d.cr}%`:"—"}</td>
                        <td style={{ padding:"5px 8px", textAlign:"center", color:d.s2?C.amber:C.gray }}>{d.s2?`${d.s2r}%`:"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Country selector */}
            <Card title="Country of Origin (Where goods are manufactured)" subtitle="Select the country where your product is made. Rates pre-fill based on current known US import tariff rates for that country.">
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {["All", ...REGIONS].map(r => (
                  <button key={r} onClick={() => setActiveRegion(r)} style={{
                    padding:"4px 10px", borderRadius:12, fontSize:11,
                    border:`1.5px solid ${activeRegion===r?C.gold:C.lightGray}`,
                    background:activeRegion===r?C.navy:C.white,
                    color:activeRegion===r?C.gold:C.gray,
                    fontFamily:"sans-serif", cursor:"pointer",
                  }}>{r}</button>
                ))}
              </div>
              <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
                placeholder="Search countries..." style={{ ...inputSt, marginBottom:10 }} />
              <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:300, overflowY:"auto" }}>
                {filteredCountries.map(([key, c]) => (
                  <button key={key} onClick={() => applyCountry(key)} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"8px 12px", borderRadius:4, cursor:"pointer",
                    border:`2px solid ${selectedCountry===key?C.gold:C.lightGray}`,
                    background:selectedCountry===key?C.navy:C.white,
                    textAlign:"left", width:"100%",
                  }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{c.f}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:"bold", color:selectedCountry===key?C.gold:C.navy, fontFamily:"sans-serif" }}>{c.l}</div>
                      <div style={{ fontSize:10, color:selectedCountry===key?C.htext:C.gray, fontFamily:"sans-serif" }}>
                        Section 122 baseline: <strong>{c.b}%</strong>
                        {c.usmca?" · USMCA qualifying goods: 0%":""}
                        {!c.s122?" · Exempt from Section 122":""}
                      </div>
                    </div>
                    {selectedCountry===key && <span style={{ fontSize:11, color:C.gold, fontFamily:"sans-serif", fontWeight:"bold" }}>✓</span>}
                  </button>
                ))}
              </div>
              {country && (
                <div style={{ marginTop:10, background:C.amberLight, border:`1px solid ${C.amber}`, borderRadius:4, padding:"8px 12px", fontSize:11, fontFamily:"sans-serif", color:C.amber }}>
                  <strong>{country.f} {country.l}:</strong> {country.n}
                </div>
              )}
            </Card>

            {/* Product value */}
            <Card title="Shipment Details" subtitle="Enter invoice value and quantity for this shipment.">
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <FieldLabel>Commercial Invoice Value (USD total shipment value)</FieldLabel>
                  <DollarInput val={productValue} set={setProductValue} placeholder="e.g. 50000" />
                </div>
                <div>
                  <FieldLabel>Quantity (units)</FieldLabel>
                  <input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 1000" style={inputSt} />
                </div>
              </div>
            </Card>

            <button onClick={() => setActiveTab("tariffs")} style={nextBtnSt}>REVIEW TARIFF RATES →</button>
          </div>
        )}

        {/* ── TAB 2 ── */}
        {activeTab==="tariffs" && (
          <div>
            <div style={{ background:C.navy2, border:`1px solid ${C.gold}`, borderRadius:6, padding:"12px 14px", marginBottom:16 }}>
              <div style={{ fontSize:12, color:C.htext, fontFamily:"sans-serif", lineHeight:1.6, marginBottom:8 }}>
                Rates pre-filled for <strong style={{ color:C.gold }}>{country?.f} {country?.l}</strong>
                {htsSuggestion ? ` · Chapter ${htsSuggestion.chapter} (${htsSuggestion.d})` : ""}. All rates are editable. Every layer applies to the CIF value and stacks additively. <strong style={{ color:C.amber }}>Exception: Section 232 products are exempt from Section 122.</strong>
              </div>
              {htsSuggestion?.s2 && (
                <div style={{ background:C.amberLight, border:`1px solid ${C.amber}`, borderRadius:4, padding:"6px 10px", fontSize:11, fontFamily:"sans-serif", color:C.amber }}>
                  ⚠ This is a Section 232 product. Section 122 baseline does NOT stack with Section 232. Consider setting the baseline rate to 0% and using only the Section 232 rate. Verify with your customs broker.
                </div>
              )}
            </div>

            <Card title="US Import Tariff Rates — Goods Imported into the United States" subtitle="Enter as percentages. Applied to CIF value (invoice + freight + insurance).">
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  { label:"MFN Base Duty Rate (%)", val:mnfRate, set:setMnfRate, color:C.navy,
                    hint:`Standard WTO Most Favored Nation rate for your HTS code.${htsSuggestion?` Chapter ${htsSuggestion.chapter} range: ${htsSuggestion.ml}% to ${htsSuggestion.mh}%.`:""} Verify the exact rate for your 10-digit HTS code at hts.usitc.gov.` },
                  { label:"Section 122 Baseline Tariff (%)", val:baselineRate, set:setBaselineRate, color:C.teal,
                    hint:`Flat 15% surcharge on most US imports effective February 22, 2026. Temporary for 150 days (expires ~July 24, 2026). USMCA goods and Section 232 products are exempt.${country?.usmca?" This country qualifies for USMCA — qualifying goods should be 0%.":""}` },
                  { label:"Section 301 Tariff — China origin only (%)", val:section301Rate, set:setSection301Rate, color:C.red,
                    hint:htsSuggestion?.c?`Chapter ${htsSuggestion.chapter} typical rate: ${htsSuggestion.cr}%. Rates vary by specific HTS code. List 1/2: 25%, List 3/4A: 7.5%, some products up to 100%. Verify at ustr.gov.`:"Section 301 does not typically apply to this chapter or this country of origin." },
                  { label:"Section 232 Tariff — Steel/Aluminum/Autos (%)", val:section232Rate, set:setSection232Rate, color:C.amber,
                    hint:htsSuggestion?.s2?`Chapter ${htsSuggestion.chapter} is a Section 232 product. Rate is ${htsSuggestion.s2r}% for most countries. NOTE: Section 122 baseline does NOT stack with Section 232. Set baseline to 0% if Section 232 applies.`:"Section 232 does not apply to this chapter." },
                  { label:"Additional / Custom Duty (%)", val:customTariff, set:setCustomTariff, color:C.gray,
                    hint:"Antidumping duties (AD), countervailing duties (CVD), or any product-specific duty not captured above. Check for AD/CVD orders at enforcement.trade.gov." },
                ].map((row, i) => (
                  <div key={i}>
                    <FieldLabel>{row.label}</FieldLabel>
                    <PctInput val={row.val} set={row.set} color={row.color} />
                    <div style={{ fontSize:11, color:C.gray, fontFamily:"sans-serif", marginTop:4, lineHeight:1.5 }}>{row.hint}</div>
                  </div>
                ))}
              </div>

              {/* Total stacked rate */}
              <div style={{ marginTop:16, background:C.navy, borderRadius:4, padding:"12px 14px" }}>
                <div style={{ fontSize:11, color:C.gold, fontFamily:"sans-serif", fontWeight:"bold", letterSpacing:1, marginBottom:6 }}>TOTAL STACKED TARIFF RATE (applied to CIF value)</div>
                <div style={{ fontSize:28, fontWeight:"bold", fontFamily:"sans-serif", color:C.gold }}>
                  {fmtPct([mnfRate, baselineRate, section301Rate, section232Rate, customTariff].reduce((s,v) => s + parse(v), 0))}
                </div>
                <div style={{ fontSize:11, color:C.htext, fontFamily:"sans-serif", marginTop:4 }}>
                  MFN {parse(mnfRate).toFixed(1)}% + Baseline {parse(baselineRate).toFixed(1)}% + S301 {parse(section301Rate).toFixed(1)}% + S232 {parse(section232Rate).toFixed(1)}% + Other {parse(customTariff).toFixed(1)}%
                </div>
              </div>
            </Card>

            {/* Rate reference guide */}
            <button onClick={() => setShowRateGuide(!showRateGuide)} style={{ background:C.navy2, border:`1px solid ${C.gold}`, borderRadius:4, padding:"10px 14px", fontSize:12, color:C.gold, fontFamily:"sans-serif", fontWeight:"bold", cursor:"pointer", width:"100%", marginBottom:16, textAlign:"left" }}>
              {showRateGuide?"▾ Hide Country Rate Reference":"▸ Show Country Rate Reference — All Countries (Section 122 Rates as of March 2026)"}
            </button>

            {showRateGuide && (
              <Card title="Country Rate Reference" subtitle="Section 122 baseline rates as of March 2026. Click any row to select that country.">
                {REGIONS.map(region => {
                  const rc = Object.entries(COUNTRIES).filter(([k,c]) => c.r===region);
                  if (!rc.length) return null;
                  return (
                    <div key={region} style={{ marginBottom:16 }}>
                      <div style={{ fontSize:11, color:C.gray, fontFamily:"sans-serif", fontWeight:"bold", letterSpacing:1, marginBottom:6 }}>{region.toUpperCase()}</div>
                      <div style={{ overflowX:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, fontFamily:"sans-serif" }}>
                          <tbody>
                            {rc.map(([key,c],i) => (
                              <tr key={key} style={{ background:i%2===0?C.white:"#F2EFE8", cursor:"pointer" }}
                                onClick={() => { applyCountry(key); setShowRateGuide(false); }}>
                                <td style={{ padding:"6px 8px" }}><span style={{ marginRight:6 }}>{c.f}</span>{c.l}</td>
                                <td style={{ padding:"6px 8px", textAlign:"center", fontWeight:"bold",
                                  color:c.b>=25?C.red:c.b>=15?C.amber:c.b>0?C.teal:C.green }}>
                                  {c.usmca?"0% (USMCA)":c.b+"%"}
                                </td>
                                <td style={{ padding:"6px 8px", fontSize:10, color:C.gray }}>{c.n.slice(0,70)}...</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize:10, color:C.gray, fontFamily:"sans-serif", marginTop:8 }}>
                  Rates as of March 2026. Section 122 15% applies to most countries. Verify at{" "}
                  <a href="https://ustr.gov" target="_blank" rel="noopener noreferrer" style={{ color:C.navy }}>ustr.gov</a>.
                </div>
              </Card>
            )}

            <button onClick={() => setActiveTab("costs")} style={nextBtnSt}>ADD OTHER COSTS →</button>
          </div>
        )}

        {/* ── TAB 3 ── */}
        {activeTab==="costs" && (
          <div>
            <InfoBox>Enter the additional costs to complete the landed cost calculation. These are costs beyond the tariff to get the product to your US facility.</InfoBox>
            <Card title="Freight and Insurance">
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <FieldLabel>Ocean / Air Freight (USD total for shipment)</FieldLabel>
                  <DollarInput val={freightCost} set={setFreightCost} placeholder="e.g. 3500" />
                  <div style={{ fontSize:11, color:C.gray, fontFamily:"sans-serif", marginTop:4 }}>Total freight cost from your freight forwarder quote. Freight + insurance = CIF value used as duty basis.</div>
                </div>
                <div>
                  <FieldLabel>Marine Insurance Rate (%)</FieldLabel>
                  <PctInput val={insuranceRate} set={setInsuranceRate} />
                  <div style={{ fontSize:11, color:C.gray, fontFamily:"sans-serif", marginTop:4 }}>Applied to invoice value. Typically 0.3% to 0.8%. Default 0.5%.</div>
                </div>
              </div>
            </Card>
            <Card title="Customs and Compliance Fees">
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { l:"Customs Broker Fee (USD)", v:brokerFee, s:setBrokerFee, h:"Fee to prepare and file the customs entry. Typically $150 to $300 per shipment." },
                  { l:"Customs Bond (USD)",        v:customsBond, s:setCustomsBond, h:"Required for formal entries. Single-entry bond typically $50 to $100." },
                  { l:"Other Fees (USD)",          v:otherFees, s:setOtherFees, h:"Port fees, ISF filing, container inspection, drayage, warehouse charges." },
                ].map((row,i) => (
                  <div key={i}>
                    <FieldLabel>{row.l}</FieldLabel>
                    <DollarInput val={row.v} set={row.s} placeholder="0" />
                    <div style={{ fontSize:11, color:C.gray, fontFamily:"sans-serif", marginTop:4 }}>{row.h}</div>
                  </div>
                ))}
              </div>
            </Card>
            <button onClick={() => setActiveTab("results")} style={nextBtnSt}>CALCULATE LANDED COST →</button>
          </div>
        )}

        {/* ── TAB 4 ── */}
        {activeTab==="results" && (
          <div>
            {!calc ? (
              <div style={{ textAlign:"center", padding:"40px", color:C.gray, fontFamily:"sans-serif", fontSize:13, background:C.white, borderRadius:6, border:`1px dashed ${C.lightGray}` }}>
                Enter product value on Tab 1 to calculate landed cost.
              </div>
            ) : (
              <>
                <div style={{ background:C.navy, border:`2px solid ${C.gold}`, borderRadius:6, padding:"16px", marginBottom:16 }}>
                  <div style={{ fontSize:10, color:C.gold, fontFamily:"sans-serif", fontWeight:"bold", letterSpacing:2, marginBottom:10 }}>
                    TOTAL LANDED COST · IMPORTED INTO THE UNITED STATES FROM {country?.f} {country?.l?.toUpperCase()}
                    {htsSuggestion?` · CHAPTER ${htsSuggestion.chapter}`:""}
                  </div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {[
                      { l:"TOTAL LANDED COST",   v:fmt(calc.totalLanded),                          hi:true },
                      { l:"PER UNIT",             v:calc.perUnit?fmt(calc.perUnit):"—" },
                      { l:"TOTAL DUTY PAID",      v:fmt(calc.totalDuty),                            col:"#F87171" },
                      { l:"EFFECTIVE DUTY RATE",  v:fmtPct(calc.effDutyPct),                        col:calc.effDutyPct>30?"#F87171":calc.effDutyPct>15?"#FCD34D":"#6EE89A" },
                      { l:"LANDED MULTIPLIER",    v:`${calc.multiplier.toFixed(3)}x` },
                    ].map((item,i) => (
                      <div key={i} style={{ flex:1, minWidth:80, background:item.hi?"rgba(200,168,75,0.15)":"rgba(255,255,255,0.05)", border:item.hi?`1px solid ${C.gold}`:"none", borderRadius:4, padding:"10px 6px", textAlign:"center" }}>
                        <div style={{ fontSize:9, color:C.htext, fontFamily:"sans-serif", marginBottom:4 }}>{item.l}</div>
                        <div style={{ fontSize:14, fontWeight:"bold", fontFamily:"sans-serif", color:item.hi?C.gold:item.col||C.white }}>{item.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Card title="Cost Breakdown" subtitle="Each component as a share of total US landed cost.">
                  {[
                    { l:"Invoice Value",     v:calc.val,      col:C.navy },
                    { l:"Freight",           v:calc.freight,  col:C.teal },
                    { l:"Insurance",         v:calc.ins,      col:"#4B7A8A" },
                    { l:"MFN Base Duty",     v:calc.mnfDuty,  col:C.amber },
                    { l:"Section 122 Baseline", v:calc.baseDuty, col:C.amber },
                    { l:"Section 301",       v:calc.s301Duty, col:C.red },
                    { l:"Section 232",       v:calc.s232Duty, col:C.red },
                    { l:"Additional Duty",   v:calc.custDuty, col:C.red },
                    { l:"Broker Fee",        v:calc.broker,   col:C.gray },
                    { l:"Customs Bond",      v:calc.bond,     col:C.gray },
                    { l:"Other Fees",        v:calc.other,    col:C.gray },
                  ].filter(r => r.v > 0).map((row,i) => {
                    const pct = (row.v / calc.totalLanded) * 100;
                    return (
                      <div key={i} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ fontSize:12, fontFamily:"sans-serif", color:C.navy }}>{row.l}</span>
                          <div style={{ display:"flex", gap:10 }}>
                            <span style={{ fontSize:10, color:C.gray, fontFamily:"sans-serif" }}>{pct.toFixed(1)}%</span>
                            <span style={{ fontSize:13, fontWeight:"bold", fontFamily:"sans-serif", color:row.col, minWidth:70, textAlign:"right" }}>{fmt(row.v)}</span>
                          </div>
                        </div>
                        <div style={{ height:6, background:C.lightGray, borderRadius:2, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:row.col, borderRadius:2 }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop:10, paddingTop:10, borderTop:`2px solid ${C.gold}`, display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:14, fontWeight:"bold", fontFamily:"sans-serif", color:C.navy }}>TOTAL LANDED COST</span>
                    <span style={{ fontSize:18, fontWeight:"bold", fontFamily:"sans-serif", color:C.navy }}>{fmt(calc.totalLanded)}</span>
                  </div>
                </Card>

                <Card title="Duty Detail" subtitle="Each US import tariff layer applied to the CIF value.">
                  <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:"sans-serif", minWidth:300 }}>
                      <thead>
                        <tr style={{ background:C.navy }}>
                          <th style={{ padding:"8px", textAlign:"left", color:C.white, fontSize:11 }}>TARIFF LAYER</th>
                          <th style={{ padding:"8px", textAlign:"center", color:C.gold, fontSize:11 }}>RATE</th>
                          <th style={{ padding:"8px", textAlign:"right", color:C.white, fontSize:11 }}>DUTY AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ background:C.lightGray }}>
                          <td style={{ padding:"8px", fontWeight:"bold", color:C.navy }}>CIF Value (duty basis)</td>
                          <td style={{ padding:"8px", textAlign:"center", color:C.gray }}>—</td>
                          <td style={{ padding:"8px", textAlign:"right", fontWeight:"bold", color:C.navy }}>{fmt(calc.cifVal)}</td>
                        </tr>
                        {[
                          { l:"MFN Base Duty",        r:parse(mnfRate),        v:calc.mnfDuty },
                          { l:"Section 122 Baseline", r:parse(baselineRate),   v:calc.baseDuty },
                          { l:"Section 301",          r:parse(section301Rate), v:calc.s301Duty },
                          { l:"Section 232",          r:parse(section232Rate), v:calc.s232Duty },
                          { l:"Additional Duty",      r:parse(customTariff),   v:calc.custDuty },
                        ].filter(r => r.r > 0).map((row,i) => (
                          <tr key={i} style={{ background:i%2===0?C.white:"#F2EFE8" }}>
                            <td style={{ padding:"8px", color:C.navy }}>{row.l}</td>
                            <td style={{ padding:"8px", textAlign:"center", color:C.gray }}>{fmtPct(row.r)}</td>
                            <td style={{ padding:"8px", textAlign:"right", color:C.red }}>{fmt(row.v)}</td>
                          </tr>
                        ))}
                        <tr style={{ background:C.navy }}>
                          <td style={{ padding:"10px 8px", fontWeight:"bold", color:C.gold, fontSize:11 }}>TOTAL DUTY</td>
                          <td style={{ padding:"10px 8px", textAlign:"center", fontWeight:"bold", color:C.gold }}>{fmtPct(calc.totalTariffPct)}</td>
                          <td style={{ padding:"10px 8px", textAlign:"right", fontWeight:"bold", color:"#F87171", fontSize:15 }}>{fmt(calc.totalDuty)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>

                <div style={{ background:C.navy2, border:`1px solid ${C.gold}`, borderRadius:6, padding:"14px 16px", marginBottom:16 }}>
                  <div style={{ fontSize:11, color:C.gold, fontFamily:"sans-serif", fontWeight:"bold", letterSpacing:1, marginBottom:6 }}>COMPARING SOURCING ALTERNATIVES</div>
                  <div style={{ fontSize:12, color:C.htext, fontFamily:"sans-serif", lineHeight:1.6 }}>
                    Run this calculator separately for each country you are evaluating. Compare the landed cost multiplier and effective duty rate across countries. A supplier quoting 15% below your current price from a high-tariff country may cost more landed than a supplier at par from a low-tariff country. The landed cost multiplier is the clearest single number for comparison.
                  </div>
                </div>

                <button onClick={() => { setProductValue(""); setQuantity(""); setFreightCost(""); setHtsInput(""); setHtsSuggestion(null); setActiveTab("product"); }}
                  style={{ background:"transparent", border:`1px solid ${C.lightGray}`, borderRadius:4, padding:"10px", fontSize:12, fontFamily:"sans-serif", color:C.gray, cursor:"pointer", letterSpacing:1, width:"100%" }}>
                  ↺ CALCULATE NEW SHIPMENT
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ background:C.navy, borderTop:`2px solid ${C.gold}`, padding:"10px 16px", textAlign:"center" }}>
        <span style={{ fontSize:10, color:C.htext, fontFamily:"sans-serif", letterSpacing:1 }}>
          FLANAGAN SOURCING INTELLIGENCE PORTFOLIO · MATTHEW FLANAGAN, CPSM · {RATE_BULLETIN.version} · RATES VERIFIED {RATE_BULLETIN.lastVerified.toUpperCase()} · VERIFY BEFORE USE
        </span>
      </div>
    </div>
  );
}

function InfoBox({ children }) {
  return <div style={{ background:C.navy2, border:`1px solid ${C.gold}`, borderRadius:6, padding:"12px 14px", marginBottom:16, fontSize:12, color:C.htext, fontFamily:"sans-serif", lineHeight:1.6 }}>{children}</div>;
}
function FieldLabel({ children }) {
  return <div style={{ fontSize:12, fontWeight:"bold", color:C.navy, fontFamily:"sans-serif", marginBottom:4 }}>{children}</div>;
}
function DollarInput({ val, set, placeholder }) {
  return (
    <div style={{ display:"flex", alignItems:"center" }}>
      <span style={{ background:C.navy, color:C.white, padding:"8px 8px", fontSize:13, fontWeight:"bold", borderRadius:"4px 0 0 4px", lineHeight:1, flexShrink:0 }}>$</span>
      <input type="number" min={0} step="0.01" value={val} onChange={e => set(e.target.value)} placeholder={placeholder||"0.00"} style={{ ...inputSt, borderRadius:"0 4px 4px 0", borderLeft:"none", flex:1 }} />
    </div>
  );
}
function PctInput({ val, set, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <input type="number" min={0} max={200} step="0.1" value={val} onChange={e => set(e.target.value)} placeholder="0"
        style={{ ...inputSt, width:100, borderLeft:color?`3px solid ${color}`:undefined }} />
      <span style={{ fontSize:13, fontFamily:"sans-serif", color:C.gray }}>%</span>
    </div>
  );
}
function Card({ title, subtitle, children }) {
  return (
    <div style={{ background:C.white, border:`1px solid ${C.lightGray}`, borderRadius:6, marginBottom:16, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ background:"#F2EFE8", borderBottom:`2px solid ${C.gold}`, padding:"10px 14px" }}>
        <div style={{ fontSize:13, fontWeight:"bold", color:C.navy, fontFamily:"sans-serif" }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:C.gray, fontFamily:"sans-serif", marginTop:2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding:"14px" }}>{children}</div>
    </div>
  );
}
const inputSt = { border:"1px solid #E8E4DC", borderRadius:4, padding:"8px 10px", fontSize:13, fontFamily:"sans-serif", color:"#1B2A4A", background:"#FFFFFF", outline:"none", width:"100%", boxSizing:"border-box" };
const nextBtnSt = { background:"#1B2A4A", color:"#FFFFFF", border:"2px solid #C8A84B", borderRadius:4, padding:"12px", fontSize:13, fontFamily:"sans-serif", fontWeight:"bold", letterSpacing:1, cursor:"pointer", width:"100%" };
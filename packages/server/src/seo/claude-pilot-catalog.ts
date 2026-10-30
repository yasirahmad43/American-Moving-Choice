/** Source-reviewed, edited Claude pilot. No provider call occurs when this file is imported. */
import type { CatalogEntry } from "./catalog";

export const CLAUDE_PILOT_MANIFEST_SHA256 = "6ad9bc1eb3075e5d8a7fffe8d83f910c8bba5440c4f859077bcbcd2252d057bc";
export const CLAUDE_PILOT_REVIEWED_AT = "2026-10-30T21:31:40.751Z";
export const CLAUDE_PILOT_CATALOG: CatalogEntry[] = [
  {
    "family": "question",
    "slug": "how-do-i-get-quotes-for-a-small-partial-move",
    "primaryKeyword": "small move quotes",
    "intent": "commercial",
    "supportingKeywords": [],
    "title": "How to Get Quotes for a Small or Partial Move",
    "h1": "How do I get quotes for a small or partial move?",
    "metaDescription": "Build an item-count and dimensions worksheet, then compare small-move quotes on the same pickup, delivery and preparation scope, including how minimum charges apply.",
    "answer": "Write down exactly which items are moving, then record each item's count, dimensions and access at both addresses. Give every provider that same list and the same preparation assumptions. Ask how any minimum charge works, and compare the written scope line by line, not only the total. A short inventory is only comparable when every quote describes the same job.",
    "sections": [
      {
        "heading": "Define exactly what is moving and what stays",
        "blocks": [
          {
            "type": "paragraph",
            "text": "For a partial move, the shipment description should distinguish what is leaving from what stays. Before you contact anyone, decide the boundary of the shipment and write it down. Providers cannot compare like with like if one hears 'a couch and some boxes' and another hears 'a couch, a dresser and the garage shelves'."
          },
          {
            "type": "list",
            "items": [
              "List every large item that is moving, such as sofa, mattress, desk or appliance.",
              "Count boxes and other loose items, and note which are already packed and which are not.",
              "Name anything borderline, such as items you may decide on later, and mark it 'maybe' instead of leaving it out.",
              "Note anything fragile, heavy or awkward that a provider should know about.",
              "Write the pickup address type and the delivery address type, for example apartment, house or storage unit."
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "Keep this list as your single source of truth. If your plans change, update the list and tell every provider, instead of adjusting the job in conversation with only one of them."
          }
        ]
      },
      {
        "heading": "Build the item-count and dimensions worksheet",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The worksheet below is an editorial suggestion, not a form any provider or regulator requires. Its purpose is to turn a vague short shipment into something you can send in the same words to each company. Measure length, width and height of each large item, and use a consistent unit throughout."
          },
          {
            "type": "table",
            "caption": "Item-count, dimensions and preparation worksheet",
            "columns": [
              "Item",
              "Count and dimensions",
              "Packing status",
              "Preparation to confirm",
              "Minimum-charge question"
            ],
            "rows": [
              [
                "Sofa",
                "Record count and L × W × H",
                "Record current wrapping",
                "Ask about legs and wrapping",
                "Ask whether the shipment minimum applies"
              ],
              [
                "Boxes",
                "Record count and box sizes",
                "Record sealed or open",
                "Confirm any packing work",
                "Ask whether the shipment minimum applies"
              ],
              [
                "Dresser",
                "Record count and L × W × H",
                "Record current wrapping",
                "Ask about drawers and disassembly",
                "Ask whether the shipment minimum applies"
              ],
              [
                "Mattress",
                "Record count and L × W × H",
                "Record any existing cover",
                "Ask about protective covering",
                "Ask whether the shipment minimum applies"
              ],
              [
                "Undecided items",
                "List items still being considered",
                "Record current condition",
                "Ask how additions would be documented",
                "Ask how an addition affects the stated minimum"
              ]
            ]
          },
          {
            "type": "note",
            "text": "The last column is a place to record what each provider tells you. Do not fill it with assumed figures. Minimum charges and how they are applied vary by provider, and this guide does not state any typical amount or weight."
          },
          {
            "type": "paragraph",
            "text": "Add a few lines at the bottom for the shipment as a whole: total box count, whether you will pack yourself, and whether you expect the provider to disassemble or reassemble anything. These preparation assumptions often explain why two totals differ."
          }
        ]
      },
      {
        "heading": "Record access at pickup and delivery",
        "blocks": [
          {
            "type": "paragraph",
            "text": "With a short inventory, access details can matter as much as the items. Add a second small section to your worksheet for each address so that every provider prices the same conditions."
          },
          {
            "type": "list",
            "items": [
              "Floor level and whether there is an elevator or only stairs.",
              "How far the truck may need to park from the door, if you know.",
              "Narrow hallways, tight stairwells or doors that large items must pass through.",
              "Building rules such as reserved elevator times or loading-dock access.",
              "Who will be present at each address, and when they can be there.",
              "Whether the delivery address is ready to receive items on your preferred date."
            ]
          },
          {
            "type": "paragraph",
            "text": "If you are unsure about any of this, say so. Writing 'unknown, will confirm' is more useful than guessing, and it tells a provider to treat that detail as open instead of settled."
          },
          {
            "type": "paragraph",
            "text": "It also helps to settle pickup and delivery arrangements and how you will reach the provider. [FMCSA's moving checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist) recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move. Put the answers beside your worksheet."
          }
        ]
      },
      {
        "heading": "Ask how minimums and included services work",
        "blocks": [
          {
            "type": "paragraph",
            "text": "If a quote includes a minimum charge, ask what it covers and how it applies to your specific inventory. Record the answer for every provider rather than assuming that a short item list determines the total."
          },
          {
            "type": "list",
            "items": [
              "Is there a minimum charge for a shipment of this size, and what does it cover?",
              "Is the price based on the items, the time, or something else, and how will that be shown in writing?",
              "Are loading, unloading, wrapping, disassembly and reassembly included or separate?",
              "What happens to the price if an item on the list changes before the move?",
              "How are stairs, long carries or parking distance handled?",
              "Who do I contact before, during and after the move?"
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "For how companies commonly structure charges in general, see [how moving companies charge](/questions/how-do-moving-companies-charge/). For local jobs, the [local moving page](/services/local/) gives wider context. Rules that apply to a local or labor-only job can differ from interstate rules, so ask each provider what applies to your particular move."
          },
          {
            "type": "note",
            "text": "If your move crosses state lines, federal rules for household-goods transport may apply. For interstate household-goods moves, [49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401) requires a written estimate covering transportation and related services. The same section permits estimate amendments before loading by mutual agreement, but does not permit amending an estimate after loading. Do not assume these rules govern a purely local move."
          }
        ]
      },
      {
        "heading": "Compare the written scope before choosing",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total. For a small move, that advice is especially practical because one omitted service can change the total more noticeably. Line up the responses in one table so differences are visible."
          },
          {
            "type": "table",
            "caption": "Comparison grid (editorial suggestion)",
            "columns": [
              "Question",
              "Provider A",
              "Provider B",
              "Provider C"
            ],
            "rows": [
              [
                "Same item list and counts used?",
                "Confirm the inventory used",
                "Confirm the inventory used",
                "Confirm the inventory used"
              ],
              [
                "Same pickup and delivery access assumptions?",
                "Confirm both access descriptions",
                "Confirm both access descriptions",
                "Confirm both access descriptions"
              ],
              [
                "Preparation and packing: who does what?",
                "Record who prepares and packs",
                "Record who prepares and packs",
                "Record who prepares and packs"
              ],
              [
                "Minimum charge: how it is described in writing",
                "Record the stated minimum",
                "Record the stated minimum",
                "Record the stated minimum"
              ],
              [
                "Services included and excluded",
                "Record inclusions and exclusions",
                "Record inclusions and exclusions",
                "Record inclusions and exclusions"
              ],
              [
                "How changes to the list are handled",
                "Ask how revisions are documented",
                "Ask how revisions are documented",
                "Ask how revisions are documented"
              ],
              [
                "Contact arrangements before, during and after",
                "Record contact details",
                "Record contact details",
                "Record contact details"
              ],
              [
                "Total as written",
                "Record the written total",
                "Record the written total",
                "Record the written total"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Fill in the total last. If one provider's scope is missing a line, ask for it in writing and then recompare. A lower total that leaves out preparation or delivery details is not the same offer as a higher total that includes them. Our guide on [comparing moving estimates](/questions/how-to-compare-moving-estimates/) covers this process in more detail."
          },
          {
            "type": "paragraph",
            "text": "If a provider's description changes your items, dates or services, update the worksheet and send the same revision to the others so the comparison stays fair."
          }
        ]
      },
      {
        "heading": "Send your shipment details",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Ready to discuss your small shipment? [Request moving quotes](/get-quotes/) using your real route, date and requested services. Keep the item-count worksheet for conversations with companies that contact you, and ask each company to confirm the same preparation and access details in writing."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "What should I measure for a small move?",
        "answer": "Measure length, width and height of each large item, and count boxes and loose items. Add notes on fragility, disassembly and whether items are packed. Record the same details for every provider so each one prices the same shipment."
      },
      {
        "question": "Will every provider charge a minimum for a small shipment?",
        "answer": "This guide cannot say. Minimum charges and how they apply differ by provider, so ask whether one applies to your shipment, what it covers and how it is shown in writing. Record the answers in the worksheet's minimum-charge column."
      },
      {
        "question": "Do federal estimate rules apply to my small move?",
        "answer": "The written-estimate requirement cited here is for interstate household-goods transport: 49 CFR 375.401 requires an estimate covering transportation and related services. For a local or labor-only job, ask which rules and documents apply rather than assuming this interstate provision governs it."
      },
      {
        "question": "Can an estimate change after my items are loaded?",
        "answer": "For interstate household-goods moves, 49 CFR 375.401 permits amendments before loading by mutual agreement and does not permit amending an estimate after loading. Confirm any changes in writing and before loading starts."
      }
    ],
    "related": [
      "question:how-do-moving-companies-charge",
      "question:how-to-compare-moving-estimates",
      "service:local"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "question",
    "slug": "loading-help-vs-full-service-moving-quotes",
    "primaryKeyword": "loading help vs full service movers",
    "intent": "commercial",
    "supportingKeywords": [],
    "title": "Loading Help vs Full-Service Movers: Which Quote Fits?",
    "h1": "Loading help or full-service movers: which quote do I need?",
    "metaDescription": "Learn who supplies the truck, driver, equipment, loading and unloading at each end, and how to request quotes you can compare like for like.",
    "answer": "Choose loading help when you already have a truck and driver and need labor at one or both ends. Choose a full-service quote when you want one provider to handle transportation plus labor. Either way, write down who supplies the truck, driver, equipment, loading and unloading, so every quote covers the same tasks.",
    "sections": [
      {
        "heading": "Separate transportation from labor tasks",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Two quotes can both say \"moving help\" and still cover very different jobs. The first decision is whether you are buying transportation, labor, or both."
          },
          {
            "type": "list",
            "items": [
              "Loading help or labor-only: specify the loading or unloading work you want, then confirm separately who arranges the truck and driver.",
              "Full-service moving: a provider that may handle loading, transportation and unloading under one scope. Confirm which of those tasks are actually included.",
              "Mixed arrangements: for example, hired labor to load, a separate vehicle for the drive, and different labor at the destination."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "Do not assume a quote includes a truck or a driver because the word \"moving\" appears in it. Ask directly, and ask for the answer to be written into the estimate."
          },
          {
            "type": "note",
            "text": "American Moving Choice lets you submit a household moving request. Ask each company that contacts you whether it accepts the loading-only, unloading-only or transportation work you need; the request form does not supply a rental truck, driver or equipment."
          }
        ]
      },
      {
        "heading": "Compare pickup and destination responsibilities",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Pickup and delivery are separate jobs. A quote might include loading but not unloading, or might cover the drive but leave carrying items inside to you. FMCSA recommends comparing the services provided, not only the quoted total, and that advice applies directly here (this guidance concerns interstate household-goods moves; use it as a sensible habit for local jobs too)."
          },
          {
            "type": "paragraph",
            "text": "Use the matrix below as an editorial worksheet. It is a suggestion for organizing your questions, not a regulatory form. Fill in one column per quote."
          },
          {
            "type": "table",
            "caption": "Responsibility matrix: write one answer per quote",
            "columns": [
              "Task",
              "Who is responsible? (you / provider / other)",
              "What does the quote say?",
              "Open question"
            ],
            "rows": [
              [
                "Truck or vehicle",
                "Name the responsible party",
                "Record the written inclusion or exclusion",
                "Ask the provider to resolve any gap"
              ],
              [
                "Driver",
                "Name the responsible party",
                "Record the written inclusion or exclusion",
                "Ask the provider to resolve any gap"
              ],
              [
                "Loading at pickup",
                "Name the responsible party",
                "Record the written inclusion or exclusion",
                "Ask the provider to resolve any gap"
              ],
              [
                "Unloading at destination",
                "Name the responsible party",
                "Record the written inclusion or exclusion",
                "Ask the provider to resolve any gap"
              ],
              [
                "Equipment (dollies, ramps, straps, pads)",
                "Name the responsible party",
                "Record the written inclusion or exclusion",
                "Ask the provider to resolve any gap"
              ],
              [
                "Packing materials and boxes",
                "Name the responsible party",
                "Record the written inclusion or exclusion",
                "Ask the provider to resolve any gap"
              ],
              [
                "Pickup contact person and phone",
                "Name the responsible party",
                "Record the written inclusion or exclusion",
                "Ask the provider to resolve any gap"
              ],
              [
                "Delivery contact person and phone",
                "Name the responsible party",
                "Record the written inclusion or exclusion",
                "Ask the provider to resolve any gap"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "If a cell is blank after you read a quote, treat that as a question to ask rather than a safe assumption."
          }
        ]
      },
      {
        "heading": "Confirm supplies, equipment and access requirements",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Even when labor is clearly included, the practical details can change the work. Ask each provider what they bring and what they expect you to have ready."
          },
          {
            "type": "list",
            "items": [
              "Equipment: Will the crew bring dollies, ramps, straps and protective padding, or should you supply them?",
              "Supplies: Are boxes, tape and wrapping included, or purchased separately?",
              "Access at both addresses: Note stairs, elevators, long carries from the door to the vehicle, tight hallways and parking limits. Share these directly with any company that contacts you.",
              "Large or fragile items: List pianos, safes, appliances or disassembly needs so the scope reflects them.",
              "Vehicle fit: If you supply the truck, check whether the load and the crew's work plan fit together."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "Keeping a short written list of these answers makes it easier to see which quote is genuinely cheaper and which one simply leaves work out."
          }
        ]
      },
      {
        "heading": "Build a like-for-like request",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FTC recommends written estimates that describe the property being moved, and comparing those estimates. A like-for-like request gives every provider the same facts so their answers line up (the FTC guidance is aimed at hiring a moving company, so apply it as a good practice for any labor arrangement)."
          },
          {
            "type": "list",
            "items": [
              "Describe the move: origin, destination, preferred date, and the rooms or items involved.",
              "State the service you want in plain terms, such as \"loading only,\" \"unloading only,\" \"loading and unloading with my own truck,\" or \"full service including transportation.\"",
              "List the access details and special items from your worksheet.",
              "Ask each provider to put the included tasks, equipment and supplies in writing.",
              "Ask how you can reach the provider before, during and after the move. FMCSA recommends establishing pickup and delivery arrangements and these contact details.",
              "Compare the filled-in matrices side by side before looking at price."
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "Be cautious with any request for cash or a large deposit before the move. FTC warns against such demands. Its guidance does not set a universal legal deposit limit or refund deadline, so ask what a deposit covers and get the terms in writing before paying anything."
          }
        ]
      },
      {
        "heading": "Describe your shipment in the quote survey",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Use your completed matrix when you [request moving quotes](/get-quotes/). Enter your real household route and requested services, then confirm the exact labor and transport split with any company that contacts you."
          },
          {
            "type": "paragraph",
            "text": "Before booking, compare the written answers for both ends of the move. The guides on [comparing moving estimates](/questions/how-to-compare-moving-estimates/) and [local moving services](/services/local/) offer related planning questions. Ask the provider which crew and equipment it proposes for your actual inventory."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FTC recommends written estimates describing the property being moved and comparing the estimates.",
                "source": {
                  "label": "FTC: Avoid scams when you hire a moving company",
                  "url": "https://consumer.ftc.gov/consumer-alerts/2024/09/avoid-scams-when-you-hire-moving-company",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FTC warns against demands for cash or a large deposit before a move. Its guidance does not set a universal legal deposit limit or refund deadline.",
                "source": {
                  "label": "FTC: Avoid scams when you hire a moving company",
                  "url": "https://consumer.ftc.gov/consumer-alerts/2024/09/avoid-scams-when-you-hire-moving-company",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FTC: Avoid scams when you hire a moving company",
        "url": "https://consumer.ftc.gov/consumer-alerts/2024/09/avoid-scams-when-you-hire-moving-company",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Is loading help the same as a full-service move?",
        "answer": "No. Loading help usually covers labor at one or both ends, while a full-service move may also include transportation. The scope differs by provider, so confirm in writing who supplies the truck, driver, equipment, loading and unloading."
      },
      {
        "question": "Should I compare quotes by price alone?",
        "answer": "No. FMCSA recommends getting several estimates and comparing the services provided, not only the total. A lower quote may leave out unloading, equipment, supplies or transportation."
      },
      {
        "question": "Is it normal to pay a large deposit upfront?",
        "answer": "Be careful. FTC warns against demands for cash or a large deposit before a move. Its guidance does not set a universal deposit limit or refund deadline, so ask what the deposit covers and get the terms in writing."
      },
      {
        "question": "Does the American Moving Choice form provide a truck or crew?",
        "answer": "No. The form does not supply a rental truck, a driver or loading equipment. It lets you describe your household move and send a request, and companies that contact you explain what they offer."
      }
    ],
    "related": [
      "service:local",
      "question:how-many-movers-do-i-need",
      "question:how-to-compare-moving-estimates"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "question",
    "slug": "moving-quotes-with-multiple-pickup-locations",
    "primaryKeyword": "movers multiple pickup locations",
    "intent": "commercial",
    "supportingKeywords": [],
    "title": "Can Movers Collect Belongings From Two Pickup Locations?",
    "h1": "Can movers collect belongings from two pickup locations?",
    "metaDescription": "Planning a move with two pickup addresses? Build a stop-by-stop register of items, access and contacts so every estimate describes the same shipment.",
    "answer": "Some movers may be able to collect from two addresses, but you should not assume every company offers it. Treat it as one shipment with two origins. Write an item list, access notes, contact person and timing for each stop, then ask every company to put the extra stop in its written scope before loading begins.",
    "sections": [
      {
        "heading": "Decide whether one provider should handle both stops",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A two-origin move often happens when a household is splitting up, when belongings sit in a home and a storage unit, or when part of the load is at a relative's house. The first decision is whether one provider should collect everything on a single job or whether two separate arrangements are simpler. There is no universal answer, and availability and terms vary by company."
          },
          {
            "type": "paragraph",
            "text": "If you want one provider to handle both stops, ask it to name the contact and explain the delivery plan. Two separate jobs can make sense when the addresses are far apart or the items are unrelated, but then you have to coordinate dates and delivery yourself. Compare both approaches using the same shipment description rather than guessing which will be easier."
          },
          {
            "type": "list",
            "items": [
              "Are both pickups in the same general area, or are they in different towns or states?",
              "Do all items go to one delivery address, or do some go elsewhere?",
              "Does either stop have limited access, such as stairs, a gate, a shared driveway or an elevator booking?",
              "Can the same person be present at both locations, or do you need a second contact?"
            ],
            "ordered": false
          },
          {
            "type": "note",
            "text": "Do not assume every mover accepts extra stops. Ask each company directly whether it can handle the second address on this shipment, and expect the answer to differ between companies."
          }
        ]
      },
      {
        "heading": "Keep separate item lists and access details with a pickup register",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A blended description leaves important details open, for example \"a three-bedroom home plus some things from my mother's garage.\" A mover reading that cannot tell which items are where, how long each stop might take, or what each location is like. A stop-by-stop pickup register fixes this. It is an editorial planning tool, not a form any regulator requires."
          },
          {
            "type": "table",
            "caption": "Pickup register: fill in one column per stop and give the same copy to every company you ask",
            "columns": [
              "Field",
              "Stop 1",
              "Stop 2"
            ],
            "rows": [
              [
                "Full address and unit number",
                "Street, city, ZIP, apartment or unit",
                "Street, city, ZIP, apartment or unit"
              ],
              [
                "Type of location",
                "House, apartment or self-storage unit",
                "House, apartment or self-storage unit"
              ],
              [
                "Items to collect",
                "Room-by-room list; note large, fragile or high-value pieces",
                "Separate list; do not merge with Stop 1"
              ],
              [
                "Items to leave behind",
                "Anything staying that could be confused with the load",
                "Anything staying that could be confused with the load"
              ],
              [
                "On-site contact",
                "Name and phone number of the person who will be there",
                "Name and phone number of the person who will be there"
              ],
              [
                "Access notes",
                "Stairs, elevator, gate codes, parking, narrow driveway, building rules",
                "Stairs, elevator, gate codes, parking, narrow driveway, building rules"
              ],
              [
                "Preferred timing",
                "Date and time window you can offer",
                "Date and time window you can offer"
              ],
              [
                "Packing status",
                "Packed, unpacked, partly packed",
                "Packed, unpacked, partly packed"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "If a company wants to see the belongings before estimating, show each pickup separately and identify which address each photo or walk-through describes. The [video survey preparation checklist](/planning/video-moving-survey-preparation-checklist/) offers related planning prompts. Keep the item register beside you so belongings are not attributed to the wrong stop."
          }
        ]
      },
      {
        "heading": "Ask how the extra stop changes the written scope",
        "blocks": [
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, [49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401) requires a written estimate covering transportation and related services. That claim is limited to interstate moves, so for a local or other move, check the rules that apply to your situation. In either case, a second pickup is part of the service you are asking for, so it belongs in whatever written document you receive."
          },
          {
            "type": "paragraph",
            "text": "Do not rely on a verbal statement such as \"we can swing by the second place too.\" Ask each company to confirm in writing the points below, then compare the answers side by side."
          },
          {
            "type": "list",
            "items": [
              "Both pickup addresses are named in the document.",
              "The items at each stop are described, or the document refers to your register.",
              "Any charge or condition tied to the second stop is stated, or the document says none applies. Do not assume a standard fee exists or does not exist.",
              "Whether the stops will be handled on the same day or on different days.",
              "How the document treats changes to the item list or addresses."
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "FMCSA's [moving checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist) recommends getting several estimates and comparing the services provided, not only the quoted total. With two stops this matters even more. A lower total may simply leave out the second address or assume fewer items. Use the register as the baseline so each estimate covers the same work, and see our guide to [comparing moving estimates](/questions/how-to-compare-moving-estimates/) for a method."
          },
          {
            "type": "note",
            "text": "For interstate household-goods moves, the same section permits estimate amendments before loading by mutual agreement, but it does not permit amending an estimate after loading. If a second stop or extra items might be added, raise it before loading day so the written scope can be settled first."
          }
        ]
      },
      {
        "heading": "Confirm the final stop order and contact plan",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Once you pick a provider, confirm the order in which the stops will be visited. The order affects when each location needs to be ready, who needs to be present, and which items end up loaded first. Ask which stop comes first, the approximate time window for each, and what happens if the first stop runs long."
          },
          {
            "type": "paragraph",
            "text": "FMCSA recommends establishing pickup and delivery arrangements and agreeing how to contact the provider before, during and after the move. For a two-stop job, turn that into specifics:"
          },
          {
            "type": "list",
            "items": [
              "Give the company the on-site contact for each stop, and make sure each person knows the plan.",
              "Ask who you should call if the crew is delayed between stops or cannot find an address.",
              "Share gate codes, parking instructions and building rules ahead of time.",
              "Ask how you will be told when loading at the first stop is finished and the crew is heading to the second.",
              "Keep a copy of the final register with the written scope so you can check both against each other on moving day."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "On the day, label or group items at each stop so the crew can see what belongs to the shipment. Items from one address that are left near items staying behind are an easy source of confusion."
          }
        ]
      },
      {
        "heading": "Discuss the two-stop shipment with each company",
        "blocks": [
          {
            "type": "paragraph",
            "text": "For a household with two pickup locations, start with your real route, date and requested services in the [moving quote request](/get-quotes/). Keep the stop-by-stop register ready for the companies that contact you; confirm both addresses, each inventory and the requested order directly with them."
          },
          {
            "type": "paragraph",
            "text": "Do not assume that a submitted request books either stop. Ask the company to document whether it can take both pickups and how that changes the scope before you make your decision."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Does every mover offer a second pickup location?",
        "answer": "No, you should not assume so. Whether a company will collect from two addresses, and on what terms, varies. Ask each company directly and get its answer in writing as part of the estimate."
      },
      {
        "question": "Is there a standard fee for an extra pickup stop?",
        "answer": "Do not assume providers use the same extra-stop charge or include the same work. Ask each company to state in writing whether a charge or condition applies to your second pickup, and compare the answers for the same inventory and access details."
      },
      {
        "question": "Can I add the second pickup after the movers have started loading?",
        "answer": "Try to settle it earlier. For interstate household-goods moves, 49 CFR 375.401 permits estimate amendments before loading by mutual agreement and does not permit amending an estimate after loading. Tell every company about both stops before you choose one."
      },
      {
        "question": "What should I give a mover so both locations are quoted consistently?",
        "answer": "Give each company the same pickup register: address, items, on-site contact, access notes and timing for each stop. Identical information makes the written scopes easier to compare."
      }
    ],
    "related": [
      "question:does-a-mover-have-to-do-a-survey",
      "planning:video-moving-survey-preparation-checklist",
      "question:how-to-compare-moving-estimates"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "question",
    "slug": "moving-quotes-with-two-delivery-addresses",
    "primaryKeyword": "movers two delivery addresses",
    "intent": "commercial",
    "supportingKeywords": [],
    "title": "Two Delivery Addresses: How to Get Comparable Moving Quotes",
    "h1": "Can a moving company deliver to two addresses?",
    "metaDescription": "Splitting one household move between two addresses? Use a destination-label key and two-stop scope checklist so every quote describes the same job.",
    "answer": "Some movers may be able to deliver one household shipment to two addresses, but do not assume it. Decide which items go where, mark everything with a destination key, and ask each company to write both stops, access details and handling into its estimate scope. That way the quotes describe the same job and can be compared fairly.",
    "sections": [
      {
        "heading": "Divide the inventory by destination",
        "blocks": [
          {
            "type": "paragraph",
            "text": "For a split delivery, put the destination of each item in writing rather than relying on memory. Before you ask anyone for a quote, decide where every item is going. A mover cannot price two stops accurately if the inventory is described as just \"the whole house.\""
          },
          {
            "type": "paragraph",
            "text": "The key below is an editorial suggestion, not a required format. Adapt the codes, but keep one rule: every item or box gets exactly one destination."
          },
          {
            "type": "table",
            "caption": "Sample destination-label key",
            "columns": [
              "Label",
              "Meaning",
              "Example contents",
              "How to mark it"
            ],
            "rows": [
              [
                "A",
                "Deliver to the first address",
                "Bedroom furniture, kitchen boxes, everyday clothing",
                "Large letter A on at least two sides of each box, plus a tag on furniture"
              ],
              [
                "B",
                "Deliver to the second address",
                "Home-office items, seasonal gear, a relative's furniture",
                "Large letter B on at least two sides of each box, plus a tag on furniture"
              ],
              [
                "Undecided",
                "Resolve before the estimate",
                "Items you have not placed yet",
                "Keep separate; ask how the final destination decision changes the scope"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Give each group a rough size, such as a room-by-room list or a count of large furniture pieces and boxes. Then ask each company to price both groups from the same list. If two people share the household and disagree about where an item belongs, settle that between yourselves first. A moving estimate cannot decide who owns what."
          }
        ]
      },
      {
        "heading": "Describe each delivery access route",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Two addresses mean two sets of access conditions. Write them down separately so a company does not quote the second stop as though it matched the first."
          },
          {
            "type": "list",
            "items": [
              "Full street address, building type and unit or floor for each stop.",
              "Stairs, elevators, long carries, narrow halls or tight turns at each stop.",
              "Where a larger vehicle could realistically park, and any known parking or building restrictions.",
              "Whether a building requires reservations or has specific hours for deliveries.",
              "Who will be present to direct the crew and sign off at each stop."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "If you do not know a detail yet, say so in the request. An honest \"unknown\" is easier for a company to account for than a guess presented as fact."
          }
        ]
      },
      {
        "heading": "Ask about scheduling and separate handling",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Delivering to two places raises practical questions that a single-address quote never has to answer. Put these in front of every company you consider, and note the answers side by side."
          },
          {
            "type": "list",
            "items": [
              "Can the company deliver to both addresses, and is that written into its estimate?",
              "Which stop comes first, and is the order fixed or flexible?",
              "Will both stops happen on the same day, or on separate days? What happens to the second group in between?",
              "Is the second stop priced as part of the same job, or as a separate service?",
              "Which services apply at each stop, such as unloading, placement, assembly or packing? Are any of them charged differently?",
              "Is the shipment covered by one set of paperwork, or does each stop have its own? Do not assume that a single document or liability arrangement applies to every service.",
              "Who is the contact person for questions before, during and after the move?"
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "That last question follows the FMCSA suggestion to [establish pickup and delivery arrangements and how to contact the provider before, during and after the move](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist). With two stops, knowing whom to call matters more, because a delay at the first address can affect the second."
          },
          {
            "type": "paragraph",
            "text": "Ask for the proposed delivery window at each address and whether the second stop depends on the first. Record who will receive updates and whom to contact if the proposed order or timing changes."
          }
        ]
      },
      {
        "heading": "Compare scope, not just the total",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends [obtaining several estimates and comparing the services provided, not only the quoted total](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist). That advice matters most for split deliveries, because one company may include both stops and another may leave the second stop out, price it separately or describe it vaguely."
          },
          {
            "type": "table",
            "caption": "Two-stop delivery-scope checklist for comparing quotes",
            "columns": [
              "Check",
              "Company 1",
              "Company 2",
              "Company 3"
            ],
            "rows": [
              [
                "Both addresses written in the scope",
                "Confirm both addresses",
                "Confirm both addresses",
                "Confirm both addresses"
              ],
              [
                "Items for A and B listed or grouped separately",
                "Confirm the A and B item lists",
                "Confirm the A and B item lists",
                "Confirm the A and B item lists"
              ],
              [
                "Access details for each stop recorded",
                "Confirm access at each stop",
                "Confirm access at each stop",
                "Confirm access at each stop"
              ],
              [
                "Delivery order and timing described",
                "Record stop order and timing",
                "Record stop order and timing",
                "Record stop order and timing"
              ],
              [
                "Services at each stop named",
                "Record each destination task",
                "Record each destination task",
                "Record each destination task"
              ],
              [
                "Paperwork and coverage terms explained for each service",
                "Ask which terms cover each service",
                "Ask which terms cover each service",
                "Ask which terms cover each service"
              ],
              [
                "Contact person identified",
                "Record the named contact",
                "Record the named contact",
                "Record the named contact"
              ]
            ]
          },
          {
            "type": "note",
            "text": "A blank cell is a question to ask, not an assumption to make. Do not fill it in on the company's behalf."
          }
        ]
      },
      {
        "heading": "Check labels and documents before loading",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Do the label check before the crew starts loading, not after. For interstate household-goods moves, [49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401) requires a written estimate covering transportation and related services. The same section allows an estimate to be amended before loading by mutual agreement, and does not permit amending it after loading. That rule applies to interstate moves. A local move may be governed by different rules, so ask the company how it handles changes."
          },
          {
            "type": "paragraph",
            "text": "In practice, if an item moves from B to A, or you realize a stop has a harder access route than you said, tell the company before loading and ask for the change in writing. Leaving it until delivery day makes it harder to fix."
          },
          {
            "type": "list",
            "items": [
              "Walk through the home with your destination key and confirm every item or box carries an A or B label.",
              "Confirm that the addresses on the paperwork match the labels and your notes.",
              "Check that any services or changes you agreed to appear in the written document you are about to sign.",
              "Photograph the labeled groups and keep a copy of the key where you can reach it on delivery day.",
              "Read the document before signing and ask what it covers, whether both stops are named and which destination services remain outside the scope."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "On delivery day, use the [delivery day checklist](/planning/delivery-day-checklist/) alongside your destination key so you can confirm each group arrives where you intended."
          }
        ]
      },
      {
        "heading": "Discuss the split with each company",
        "blocks": [
          {
            "type": "paragraph",
            "text": "When your destination key is ready, [request moving quotes](/get-quotes/) with your real route, date and services. Keep the A and B lists for conversations with companies that contact you, and ask each company to confirm both delivery addresses and the access details in its written response."
          },
          {
            "type": "paragraph",
            "text": "Use the same split-delivery checklist for every response. Confirm scheduling, paperwork and any service at each stop directly with the company before booking."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Will every moving company deliver one shipment to two addresses?",
        "answer": "Not necessarily. Whether a company will do it, and on what terms, depends on that company. Ask directly and make sure both stops appear in the written scope rather than relying on a verbal yes."
      },
      {
        "question": "Does a split delivery mean one contract and one set of coverage terms?",
        "answer": "Do not assume so. Ask each company whether the stops fall under the same paperwork, which services apply at each stop, and what coverage terms apply to each service. Get the answers in writing."
      },
      {
        "question": "Can I change which items go to which address after loading?",
        "answer": "For interstate household-goods moves, 49 CFR 375.401 permits estimate amendments before loading by mutual agreement and does not permit amending an estimate after loading. For any move, raise changes before loading and ask how the company handles them."
      }
    ],
    "related": [
      "planning:delivery-day-checklist",
      "question:what-is-a-moving-delivery-spread",
      "question:what-is-a-bill-of-lading"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "question",
    "slug": "moving-quote-before-destination-address-is-known",
    "primaryKeyword": "moving quote destination address unknown",
    "intent": "commercial",
    "supportingKeywords": [],
    "title": "Moving Quote Before You Know Your New Address: What to Share",
    "h1": "Can I get a moving quote before I know my new address?",
    "metaDescription": "Plan a move before the new address is final: separate confirmed facts from open questions, and submit a quote request only when both real ZIP codes are known.",
    "answer": "Prepare a planning sheet before the new address is final, and ask a moving company whether it can discuss the unresolved details. Separate confirmed inventory, origin and dates from unknown destination information. American Moving Choice needs real origin and destination ZIP codes, so wait to submit its survey if the destination ZIP is not confirmed. Update the company when the address and access are known.",
    "sections": [
      {
        "heading": "Sort what you know from what you do not",
        "blocks": [
          {
            "type": "paragraph",
            "text": "An unknown address does not make the whole move unknown. Most of what a mover needs to start thinking about your job, such as where you are leaving from, roughly what you own and when you hope to go, is probably already settled. The destination is usually the open piece. Writing the two groups down separately keeps you from presenting a guess as a fact and keeps the mover from quietly building on it."
          },
          {
            "type": "paragraph",
            "text": "The sheet below is an editorial suggestion, not a form any regulator requires. Copy it into a note and fill in what applies."
          },
          {
            "type": "table",
            "caption": "Confirmed / provisional information sheet",
            "columns": [
              "Item",
              "Confirmed",
              "Provisional or unknown"
            ],
            "rows": [
              [
                "Origin address and ZIP",
                "Full street address, unit, floor, elevator or stairs",
                "Anything about parking you have not checked"
              ],
              [
                "Destination",
                "City or area, if truly decided",
                "Street address, building type, ZIP if the area is still open"
              ],
              [
                "Dates",
                "Earliest and latest dates you can leave",
                "Delivery window, which may depend on the new home"
              ],
              [
                "Inventory",
                "Rooms, large furniture, appliances, boxes you have counted",
                "Items you may sell or add before the move"
              ],
              [
                "Services",
                "Loading, unloading, packing, disassembly you definitely want",
                "Storage, extra stops, specialty items you are considering"
              ],
              [
                "Access at destination",
                "Nothing yet, if the address is unknown",
                "Stairs, elevator, long carry, parking, building rules"
              ]
            ]
          },
          {
            "type": "note",
            "text": "Mark a detail \"not known\" rather than filling it with a plausible guess. This keeps the open question visible when you discuss the shipment with a company."
          }
        ]
      },
      {
        "heading": "Where the quote form fits when the destination is open",
        "blocks": [
          {
            "type": "paragraph",
            "text": "American Moving Choice asks for real origin and destination ZIP codes. If the destination ZIP is not yet known, use the worksheet to prepare and wait to submit the survey. Do not enter a made-up ZIP, choose one because an area seems more likely, or treat a housing-search area as a confirmed destination."
          },
          {
            "type": "list",
            "items": [
              "Record any destination area you are considering as provisional in your personal planning sheet, not as a settled address.",
              "If you contact a moving company before the destination is final, explain what is unknown and ask what it can discuss at that stage.",
              "Once you know both real ZIP codes, use them in the survey. If only the street or unit is unresolved, explain that limitation when a company contacts you and ask what it needs before producing its estimate."
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "Keep confirmed information and open questions together for the company conversation. Do not turn a preliminary discussion into a booking decision without checking the written scope and its destination assumptions."
          }
        ]
      },
      {
        "heading": "A planning conversation is not a written estimate",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Early talks with a mover are useful for learning how the process works, what they would want to know about your inventory and which services might apply. They are not the same as a written estimate. For interstate household-goods moves, [49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401) requires a written estimate that covers transportation and related services. That requirement is about interstate transport; for a local move, ask the company what documents it provides and what they include."
          },
          {
            "type": "paragraph",
            "text": "If a phone figure or email range is offered before the destination is known, ask what it assumes about distance, services and inventory. Ask what still needs confirmation before the company can provide its written estimate. Save those assumptions beside the provisional information sheet rather than treating them as settled facts."
          },
          {
            "type": "paragraph",
            "text": "When you compare responses, FMCSA's [Moving Checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist) recommends getting several estimates and comparing the services provided, not only the quoted total. An early figure built on an unknown destination makes that comparison harder, so line up what each one includes and what it leaves out."
          }
        ]
      },
      {
        "heading": "Raise storage as a contingency, not an assumption",
        "blocks": [
          {
            "type": "paragraph",
            "text": "If your closing, lease start or travel plans might leave a gap between pickup and delivery, mention it at the start. Present it as a possibility: \"We may need storage if the new home is not ready.\" Do not assume a company offers it, has space on your dates, or can fit it into the route you want."
          },
          {
            "type": "list",
            "items": [
              "Ask whether the company offers storage or would involve another provider, and who you would be dealing with.",
              "Ask what you would need to decide, and by when, if the new home is delayed.",
              "Ask how the written scope would describe storage, pickup from storage and final delivery.",
              "Ask what happens to the estimate if you do not end up needing storage."
            ]
          },
          {
            "type": "paragraph",
            "text": "Keep a contingency entry for any gap: proposed dates, who you would ask to hold the items, and which pickup or later-delivery tasks still need written confirmation. Treat these as open questions until the provider responds."
          }
        ]
      },
      {
        "heading": "Update the address and access before anything is finalized",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Once the new address is certain, send it in writing along with the access details you could not give earlier. Ask the company to confirm in writing whether the estimate or service description changes. Timing matters for interstate household-goods moves: 49 CFR 375.401 allows estimate amendments before loading by mutual agreement, and it does not permit amending an estimate after loading. Settling destination facts before the truck is loaded is the safer course."
          },
          {
            "type": "paragraph",
            "text": "FMCSA also recommends establishing pickup and delivery arrangements and agreeing how to contact the provider before, during and after the move. Treat that as part of the same update, particularly if the delivery location was once unknown."
          },
          {
            "type": "list",
            "items": [
              "What is the exact delivery address, unit number and ZIP, and does it match what is in the estimate?",
              "Are there stairs, an elevator, a long carry from the truck, or parking limits at the new place?",
              "Does the building require reserved elevator time, insurance paperwork or other advance steps? Ask the property manager, then pass it on.",
              "Which services in the written scope changed because of the final address?",
              "Who is my contact on pickup day, on delivery day and if something goes wrong in between?",
              "What is the delivery window, and how will changes to it be communicated?",
              "Is anything still marked provisional in the paperwork? If so, what resolves it?"
            ],
            "ordered": true
          },
          {
            "type": "note",
            "text": "These questions are editorial suggestions to help you stay organized. Which documents and protections apply to your move depends on its type and on the company's own terms, so read what you are given before agreeing."
          }
        ]
      },
      {
        "heading": "Ready to describe your shipment?",
        "blocks": [
          {
            "type": "paragraph",
            "text": "When both real ZIP codes are confirmed, you can [request moving quotes](/get-quotes/). Keep the confirmed/provisional sheet for follow-up conversations, and tell the company which street, unit or access details still need confirmation. If the destination ZIP remains unknown, continue planning before submitting the survey."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Can I use a placeholder ZIP for a destination I have not chosen?",
        "answer": "No. Use the real origin and destination ZIP codes. If the destination ZIP is unknown, prepare your planning sheet and wait to submit the survey; do not use a made-up code or one chosen only because a neighborhood seems likely."
      },
      {
        "question": "Is an early price range the same as a written estimate?",
        "answer": "No. A range given in conversation is preliminary. For interstate household-goods moves, federal rules call for a written estimate covering transportation and related services. Ask what the early figure assumes and when a written version will replace it."
      },
      {
        "question": "What if the destination changes after I have received an estimate?",
        "answer": "Tell the company in writing as soon as you know. For interstate household-goods moves, 49 CFR 375.401 permits amendments before loading by mutual agreement and does not permit amending an estimate after loading, so settle changes before pickup."
      },
      {
        "question": "Should I mention storage if I am not sure I need it?",
        "answer": "Yes, as a possibility. Ask whether the company offers it, what it would involve and how it would appear in the written scope, without assuming space or availability on your dates."
      }
    ],
    "related": [
      "planning:moving-with-a-storage-gap",
      "question:are-online-moving-quotes-accurate",
      "question:does-a-mover-have-to-do-a-survey"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "question",
    "slug": "change-delivery-address-after-booking-movers",
    "primaryKeyword": "change delivery address after booking movers",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Changing your delivery address after booking movers",
    "h1": "What should I do if my delivery address changes after booking?",
    "metaDescription": "Notify your mover of a delivery-address change in writing, list access differences, and ask how the request affects the agreed service, price and timing.",
    "answer": "Send the carrier a dated written notice listing the old destination, new destination and access differences. Ask whether it accepts the change and how the agreed service, price and timing would be affected. For interstate household-goods moves, estimate amendments under 49 CFR 375.401 are permitted before loading by mutual agreement, not after loading. If loading has begun, ask how the request can be handled under the existing documents.",
    "sections": [
      {
        "heading": "Notify the carrier through the contact you agreed on",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A new destination changes the job. Do not leave it as a passing remark to the driver or a crew member on moving day. Use the contact method named in your booking paperwork, such as the dispatcher, your account representative or the email on your confirmation, and put the change in writing with the date you send it."
          },
          {
            "type": "paragraph",
            "text": "If you first raise the change by phone, follow up with a short message summarizing what you said. FMCSA recommends establishing pickup and delivery arrangements, and how to reach the provider before, during and after the move. Treat an address change as a reason to check those arrangements again."
          },
          {
            "type": "list",
            "items": [
              "Confirm who at the company handles destination changes.",
              "Ask for a backup contact in case that person is unavailable.",
              "Give the carrier a phone number and email you will actually monitor during the move.",
              "Ask the carrier to reply in writing so you have a record that it received the change."
            ],
            "ordered": false
          }
        ]
      },
      {
        "heading": "Describe the address change and the access changes separately",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A new street address is only part of what a carrier needs to know. The new place may involve a different building type, a longer carry, a tighter truck approach or different stairs or elevator access. Listing these separately keeps the notice clear and makes it easier for the carrier to say what it has or has not reviewed."
          },
          {
            "type": "table",
            "caption": "Comparison to include in your notice (editorial suggestion)",
            "columns": [
              "Detail",
              "Old destination",
              "New destination",
              "Why to state it"
            ],
            "rows": [
              [
                "Full street address and unit",
                "Record the original full street address and unit",
                "Record the new full street address and unit",
                "Removes any doubt about where the shipment goes"
              ],
              [
                "Building or home type",
                "Record the original building or home type",
                "Record the new building or home type",
                "Helps the carrier see whether the job is different"
              ],
              [
                "Truck parking or approach",
                "Record the original truck parking or approach",
                "Record the new truck parking or approach",
                "Narrow streets or restricted parking may matter to the crew"
              ],
              [
                "Stairs, elevator or long carry",
                "Record the original stairs, elevator or long carry",
                "Record the new stairs, elevator or long carry",
                "Access can change how delivery is handled"
              ],
              [
                "Building rules or reserved times",
                "Record the original building rules or reserved times",
                "Record the new building rules or reserved times",
                "Record any delivery times confirmed by management"
              ],
              [
                "On-site contact and phone",
                "Record the original on-site contact and phone",
                "Record the new on-site contact and phone",
                "Identify the person you plan to contact at delivery"
              ]
            ]
          },
          {
            "type": "note",
            "text": "Do not assume that a new address in the same city is a trivial change. Describe what you know, mark anything you are unsure of, and let the carrier tell you what else it needs."
          }
        ]
      },
      {
        "heading": "Ask for a written response on service, price and timing",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Ask the carrier to confirm whether it accepts the new destination and to explain the effect on service, price and delivery timing in writing. Before loading, ask whether a revised estimate or scope document is needed. If loading has already begun, ask how it proposes to handle the request under the existing documents; do not assume the estimate can be rewritten."
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, [49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401) requires a written estimate covering transportation and related services. It permits estimate amendments before loading by mutual agreement. The section does not permit amending an estimate after loading. If your move is interstate, raise the change before loading day. If your move is local or otherwise outside that scope, ask the carrier which terms apply, because they may differ."
          },
          {
            "type": "paragraph",
            "text": "Read any written response against the original agreement. [FMCSA recommends](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist) comparing the services provided, not only the quoted total. Check what the carrier says it has accepted and whether its response identifies unresolved service or delivery questions."
          },
          {
            "type": "list",
            "items": [
              "Does the carrier's written response identify the destination it has accepted, or state what remains unresolved?",
              "Does it describe any access differences you reported?",
              "Which services are listed, and has any service been added or removed?",
              "What price is stated, and what does that price cover?",
              "What delivery timing or window is stated?",
              "Who must agree to the change, and has that agreement been recorded in writing?"
            ],
            "ordered": true
          }
        ]
      },
      {
        "heading": "An address-change notice you can adapt",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The following is a recommended layout, not a form that any regulator requires. Adjust it to match your paperwork and send it through the carrier's agreed contact."
          },
          {
            "type": "list",
            "items": [
              "Header: your name, booking or reference number, pickup date and the date you are sending the notice.",
              "Old destination: the address currently listed in your paperwork.",
              "New destination: the full new address and unit number.",
              "Access differences: the stairs, elevator, parking, carry distance and building rules you know of, marked as known or unknown.",
              "On-site contact: name and phone for delivery.",
              "Request: written confirmation of whether the destination change is accepted and how the agreed service, price and timing would be affected.",
              "Confirmation fields: carrier contact, date and time received, acceptance or open questions, and any document the carrier says applies.",
              "Requested response date: allow time before loading if it has not started; if it has, contact the carrier promptly and ask about the current shipment."
            ],
            "ordered": true
          },
          {
            "type": "note",
            "text": "Leave the carrier's confirmation fields blank for the carrier to complete. Do not fill them in on its behalf."
          }
        ]
      },
      {
        "heading": "Keep the old and new documents together",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A changed destination produces a chain of paperwork. Keep it in one folder, digital or paper, so you can compare versions if the details later differ. Do not discard the original estimate or booking confirmation because a revised version exists."
          },
          {
            "type": "list",
            "items": [
              "The original booking confirmation and estimate.",
              "Your dated address-change notice.",
              "The carrier's written reply and any revised scope.",
              "Messages that confirm who received the change and when.",
              "The inventory and shipment documents you were given, kept alongside the address-change correspondence.",
              "Any inventory updates, which have their own checklist in [binding estimate inventory changes](/planning/binding-estimate-inventory-change-checklist/)."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "If the new home may not be ready, ask the carrier whether storage or later delivery would be needed, who would arrange it and what written terms would apply. Do not assume an option has been accepted simply because you asked about it."
          }
        ]
      },
      {
        "heading": "If you are still choosing a mover",
        "blocks": [
          {
            "type": "paragraph",
            "text": "If you are still choosing a mover and know both real ZIP codes, [request moving quotes](/get-quotes/). Keep possible destination changes on your own planning sheet and ask each company how it would address them before booking. If you have already booked, send an address-change request to your existing carrier rather than treating a new quote request as an amendment to that booking."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Can I change my delivery address after the movers have loaded?",
        "answer": "Contact the carrier promptly in writing and ask whether and how it can handle the request under your existing documents. Do not assume it accepts the new destination. For interstate household-goods moves, 49 CFR 375.401 permits estimate amendments before loading by mutual agreement and does not permit amending an estimate after loading."
      },
      {
        "question": "Will a new delivery address cost more?",
        "answer": "Ask the carrier to explain the effect on service, price and timing in a written response identifying the applicable terms. Do not assume the change is free, that it adds a charge, or that the carrier has accepted it before receiving its answer."
      },
      {
        "question": "What if I do not have the final new address yet?",
        "answer": "Tell the carrier early and ask what information it needs and by when. Share what you know about the likely destination and mark the rest as unknown. Then request written confirmation of any revised terms once the address is final."
      }
    ],
    "related": [
      "planning:binding-estimate-inventory-change-checklist",
      "question:what-is-a-bill-of-lading",
      "planning:moving-with-a-storage-gap"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "question",
    "slug": "do-movers-disassemble-and-reassemble-furniture",
    "primaryKeyword": "do movers disassemble furniture",
    "intent": "commercial",
    "supportingKeywords": [],
    "title": "Do Movers Disassemble and Reassemble Furniture? A Task Schedule",
    "h1": "Do movers disassemble and reassemble furniture?",
    "metaDescription": "Some movers take furniture apart and rebuild it, but scope varies. Use a task schedule to agree items, hardware custody and reassembly before you book.",
    "answer": "Some movers disassemble and reassemble some furniture, but you should not assume every company does either task for every piece. Name each item, then agree in writing who takes it apart, packs it, keeps the hardware, rebuilds it and whether a specialist is needed. Settle these points before booking, not on moving day.",
    "sections": [
      {
        "heading": "Why \"assembly included\" is not specific enough",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Furniture handling is a service boundary, not a default. One company may take apart a simple bed frame but not a built-in unit. Another may disassemble but leave rebuilding to you. A third may use a separate installer for certain items. A phrase like \"assembly included\" hides all of that."
          },
          {
            "type": "paragraph",
            "text": "The fix is to name every piece that matters to you. \"Two bed frames, one dining table, one wardrobe\" gives a mover something concrete to confirm or decline. \"Basic furniture\" does not."
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services ([49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401)). Furniture tasks are a related service you want to see in that document, or in whatever written scope the company gives you, rather than rely on a verbal assurance. For a local or labor-only job, ask how the company documents its scope, because the federal rule above is limited to interstate transport."
          }
        ]
      },
      {
        "heading": "Build your furniture task schedule",
        "blocks": [
          {
            "type": "paragraph",
            "text": "This schedule is an editorial suggestion, not a regulatory form. Fill in one row per item that might need to be taken apart, protected or rebuilt, then ask each company to confirm or correct it."
          },
          {
            "type": "table",
            "caption": "Furniture task schedule (example rows; replace with your own items)",
            "columns": [
              "Item and model",
              "Disassembly",
              "Packing",
              "Hardware custody",
              "Reassembly or specialist"
            ],
            "rows": [
              [
                "Bed frame (brand, model)",
                "Mover / me / not needed",
                "Pads, wrap or box?",
                "Who bags and labels it?",
                "Confirm who rebuilds it, whether a specialist is needed, and who arranges that work"
              ],
              [
                "Dining table (brand, model)",
                "Mover / me / not needed",
                "Top and legs protected how?",
                "Who keeps it?",
                "Confirm who rebuilds it, whether a specialist is needed, and who arranges that work"
              ],
              [
                "Wardrobe or tall storage",
                "Mover / me / not needed",
                "Doors and shelves handled how?",
                "Who keeps it?",
                "Confirm who rebuilds it, whether a specialist is needed, and who arranges that work"
              ],
              [
                "Sectional or modular seating",
                "Mover / me / not needed",
                "Pieces wrapped how?",
                "Connectors: who keeps them?",
                "Confirm who rebuilds it, whether a specialist is needed, and who arranges that work"
              ],
              [
                "Desk or workstation",
                "Mover / me / not needed",
                "Drawers and panels handled how?",
                "Who keeps it?",
                "Confirm who rebuilds it, whether a specialist is needed, and who arranges that work"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Add a short note under each row for anything unusual, such as a piece you have never taken apart, a missing part, or an item already damaged. The goal is no surprises for either side."
          }
        ]
      },
      {
        "heading": "Identify the right instructions for each piece",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Furniture is built differently, so the maker's instructions matter more than general habits. Writing down the brand and model number for each item lets a company judge whether the job is routine for them or needs more time or a specialist."
          },
          {
            "type": "list",
            "items": [
              "Find the brand, product name and model or SKU on a label, receipt or order confirmation.",
              "Locate the assembly sheet or manufacturer's guide. If you no longer have it, check whether the maker offers a copy and save it with your moving papers.",
              "Photograph each piece from several angles before anything is taken apart, including how drawers, doors and shelves sit.",
              "Tell the company about anything fragile, antique, glued, custom or already loose, and record its response.",
              "If a piece cannot safely be taken apart, say so on the schedule and ask how the company would move it intact."
            ],
            "ordered": true
          },
          {
            "type": "note",
            "text": "Keep the manufacturer's instructions available and ask who will handle the item using that guidance. If the company cannot confirm the task, ask whether a qualified specialist is needed rather than improvising a disassembly method."
          }
        ]
      },
      {
        "heading": "Record who keeps hardware and parts",
        "blocks": [
          {
            "type": "paragraph",
            "text": "To make the rebuilding plan clear, name who keeps the screws, brackets and connectors for each piece and record where those parts will travel."
          },
          {
            "type": "list",
            "items": [
              "Ask whether hardware is bagged and labeled by item, and who does the labeling.",
              "Ask where the bags travel: taped to the furniture, in a marked box, or with you.",
              "Consider keeping the hardware for essential pieces, such as beds, with you rather than on the truck. This is a suggestion, not a requirement.",
              "Take a photo of each labeled bag and the piece it belongs to.",
              "At delivery, check that every labeled bag is present before the crew leaves."
            ]
          },
          {
            "type": "paragraph",
            "text": "If packing materials are part of the plan, see the [packing services guide](/services/packing/) for how packing tasks are usually described, then tie those descriptions back to the rows in your schedule."
          }
        ]
      },
      {
        "heading": "Confirm rebuilding, specialists and changes in writing",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Taking something apart and putting it back together are separate tasks, and a company may offer one without the other. For each row, confirm whether the crew rebuilds the piece at the destination, whether you do it yourself, or whether a separate installer is needed. Ask who arranges and pays for that installer, and put the answer in writing."
          },
          {
            "type": "paragraph",
            "text": "Timing matters too. For interstate household-goods moves, 49 CFR 375.401 permits estimate amendments before loading by mutual agreement, and the section does not permit amending an estimate after loading. In practice, that is a strong reason to finish your furniture list before the crew starts loading, not afterwards. For local moves, ask the company how and when scope changes are documented."
          },
          {
            "type": "paragraph",
            "text": "FMCSA also recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move ([FMCSA Moving Checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist)). If a part is missing or a piece will not go back together, you will want to know who to call and how to reach them."
          }
        ]
      },
      {
        "heading": "Compare furniture scope, not only the total",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total. Furniture tasks are an easy place for two similar-looking totals to hide different scopes. Send each company the same schedule and compare the answers side by side."
          },
          {
            "type": "list",
            "items": [
              "Does the estimate list the specific items, or only general wording?",
              "Is disassembly priced or described separately from reassembly?",
              "Does the company say which items it will not take apart?",
              "Who keeps the hardware, and is that written down?",
              "Is any specialist, such as an installer, outside the company's scope?"
            ]
          },
          {
            "type": "paragraph",
            "text": "The [estimate service inclusions checklist](/planning/estimate-service-inclusions-checklist/) and the guide on [how to compare moving estimates](/questions/how-to-compare-moving-estimates/) can help you put those answers next to each other."
          }
        ]
      },
      {
        "heading": "Before you request quotes",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Before you [request moving quotes](/get-quotes/), list the furniture that may need disassembly, protection or rebuilding. Keep the task schedule for companies that contact you, and ask each company to confirm the items it accepts, hardware custody and any separately arranged installer before booking."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Do all movers disassemble and reassemble furniture?",
        "answer": "No. Practices differ by company, crew, item and job type. Some will handle simple pieces, some will only disassemble, and some leave complex items to you or a separate installer. Ask about each named item and get the answer in writing."
      },
      {
        "question": "Is the task schedule a legal requirement?",
        "answer": "No. It is an editorial suggestion to make the conversation specific. The federal estimate rule cited here applies to interstate household-goods moves and requires a written estimate covering transportation and related services, but it does not prescribe this worksheet."
      },
      {
        "question": "Who should keep the screws and hardware?",
        "answer": "Agree on a named person and storage location for each item's parts before moving day. Record who bags and labels them, where they travel and who checks them at delivery. Ask about essential items such as beds rather than assuming the crew or customer keeps every hardware bag."
      },
      {
        "question": "What if I discover another furniture task on moving day?",
        "answer": "For interstate household-goods moves, 49 CFR 375.401 permits estimate amendments before loading by mutual agreement and does not permit amending after loading. Finish your furniture list early, and for local moves ask how the company handles scope changes."
      }
    ],
    "related": [
      "service:packing",
      "planning:estimate-service-inclusions-checklist",
      "question:how-to-compare-moving-estimates"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "question",
    "slug": "moving-unpacking-and-box-removal-services",
    "primaryKeyword": "movers unpacking and box removal",
    "intent": "commercial",
    "supportingKeywords": [],
    "title": "Do Moving Services Include Unpacking and Box Removal?",
    "h1": "Do moving services include unpacking and box removal?",
    "metaDescription": "Learn how to quote unpacking, item placement, assembly and box removal as separate tasks, with a destination-service matrix to compare written scopes.",
    "answer": "Not automatically. Opening cartons, placing items, assembling furniture and taking away packaging are separate destination tasks, and a provider may price, limit or exclude each one. Decide which rooms and tasks you want, ask what packaging will be removed and when, and get the scope in writing. For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
    "sections": [
      {
        "heading": "Separate carton opening from arranging possessions",
        "blocks": [
          {
            "type": "paragraph",
            "text": "\"Unpacking\" can mean very different things. One provider may mean cutting open cartons and leaving them where they sit. Another may mean removing contents, placing items on shelves or in cupboards, and making beds. Because the word is so loose, avoid asking only whether unpacking is included. Ask which of these tasks are included, which are optional and which are not offered."
          },
          {
            "type": "list",
            "items": [
              "Carton opening: are boxes opened and contents left out, or left sealed?",
              "Paper and wrap handling: is wrapping paper or padding unwrapped from each item?",
              "Placement: who decides where items go, and in which rooms?",
              "Assembly: are beds, tables, shelving or other furniture reassembled, and is that separate from unpacking?",
              "Cleanup: are emptied cartons and packing material collected at all?"
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "Write down your answer to each line before you request quotes. A household that only wants beds assembled and kitchen cartons opened has a very different need from one that wants every room fully set up. Quoting the narrower scope accurately is usually easier than correcting an assumption on delivery day."
          },
          {
            "type": "note",
            "text": "Describe packing at origin and unpacking at destination as separate requested tasks. The [packing services overview](/services/packing/) provides related context; ask the company which work and materials its written response actually includes at each end."
          }
        ]
      },
      {
        "heading": "Describe destination rooms and receiving space",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Destination work depends on the space as much as the inventory. A provider can only give a useful scope if it knows what the rooms are like when the shipment arrives. Prepare a short description of each room that will receive items."
          },
          {
            "type": "list",
            "items": [
              "Which rooms need work, and which can simply receive sealed cartons?",
              "Are floors, counters and closets clear, or is the home still being painted, cleaned or renovated?",
              "Will furniture already be in place, or does it need to be positioned first?",
              "Are there stairs, elevators, narrow halls or limited parking that affect how items get to each room?",
              "Will someone be present to say where things go?"
            ]
          },
          {
            "type": "paragraph",
            "text": "If you cannot confirm that a room will be ready, say so. A scope written for an empty, finished room may not fit a space that is still being prepared. That is a good reason to put the condition of each room in the estimate request."
          }
        ]
      },
      {
        "heading": "Confirm what packaging can be removed and when",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Box removal is a distinct question from unpacking. Some providers may take away emptied cartons or paper, some may only do so at the time of delivery, and some may not offer it. Do not assume that a provider that unpacks will also dispose of the packaging, or that any recycling or disposal arrangement exists. Ask directly and record the answer."
          },
          {
            "type": "list",
            "items": [
              "Which materials will be taken away: cartons, paper, padding, wardrobe boxes, tape and bags?",
              "Is removal done the same day as delivery, at a later visit, or not at all?",
              "Does removal apply only to materials the provider supplied, or to any cartons?",
              "Is there a stated limit on volume, or a condition such as flattened cartons?",
              "Is removal listed as a charge, and how is it described in the written scope?"
            ]
          },
          {
            "type": "paragraph",
            "text": "If the provider does not remove packaging, plan how you will handle it, including where cartons can be stored temporarily and whether your building or local service has rules for flattened boxes. Keep those arrangements separate from anything the provider has agreed in writing."
          }
        ]
      },
      {
        "heading": "Build a destination-service matrix",
        "blocks": [
          {
            "type": "paragraph",
            "text": "This matrix is an editorial worksheet, not a regulatory form. Fill one row per room and task, then send the same version to every provider so the responses can be compared like for like. Completion criteria are the most useful column: they turn a vague task into something that can be checked at the end of the day."
          },
          {
            "type": "table",
            "caption": "Sample destination-service matrix (edit to fit your household)",
            "columns": [
              "Room",
              "Task",
              "Packaging",
              "Completion criteria"
            ],
            "rows": [
              [
                "Kitchen",
                "Open cartons and place items on counters",
                "Paper removed from items; cartons taken away or stacked, as agreed",
                "All kitchen cartons opened; contents on counters; no sealed kitchen cartons remain"
              ],
              [
                "Primary bedroom",
                "Assemble bed frame; place mattress",
                "Mattress cover and padding removed or left, as agreed",
                "Agreed frame reassembly and placement checked; any missing parts recorded"
              ],
              [
                "Children's room",
                "Open cartons only",
                "Cartons left in room",
                "Cartons open; contents not arranged"
              ],
              [
                "Living room",
                "Position furniture to a marked plan",
                "Furniture pads removed",
                "Furniture in agreed positions; pads gone"
              ],
              [
                "Garage or storage",
                "Place sealed cartons only",
                "No unpacking",
                "Cartons stacked in the agreed area; nothing opened"
              ],
              [
                "Whole home",
                "Packaging removal",
                "Which materials, which day",
                "Agreed materials removed or exclusion written down"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "If a task is not wanted, write \"not requested\" rather than leaving the cell blank. A blank can be read as either yes or no."
          }
        ]
      },
      {
        "heading": "Compare written scope, not only the total",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends getting several estimates and comparing the services provided, not just the quoted total, in its [Moving Checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist). Destination tasks are a clear example: two totals can look similar while one includes carton opening and the other leaves it out."
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, [49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401) requires a written estimate covering transportation and related services. That rule is limited to interstate household-goods transport. For a local move or a labor-only arrangement, do not assume the same rule applies; ask the provider how it documents the scope and get the agreed tasks written down anyway."
          },
          {
            "type": "paragraph",
            "text": "Timing matters if you decide to add or remove destination tasks. For interstate household-goods moves, the same section permits estimate amendments before loading by mutual agreement, and it does not permit amending an estimate after loading. If you are unsure whether you will want unpacking or assembly, settle it before loading, not on delivery day."
          }
        ]
      },
      {
        "heading": "Record exclusions and any follow-up visit",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The last step is to capture what is not covered. Exclusions are easy to miss because they are often described in a single line. Ask the provider to state them in the same document as the services you are buying."
          },
          {
            "type": "list",
            "items": [
              "Tasks the provider will not perform, such as placing items in cabinets or assembling certain furniture.",
              "Materials that will not be removed.",
              "Whether a follow-up visit is possible, what it would cover and how it would be scheduled and described.",
              "Who to contact if some cartons are left unopened or tasks are unfinished.",
              "How and when you can reach the provider before, during and after the move."
            ]
          },
          {
            "type": "paragraph",
            "text": "That last item follows another FMCSA recommendation: establish pickup and delivery arrangements and how to contact the provider before, during and after the move. Our [delivery day checklist](/planning/delivery-day-checklist/) can help you plan what to check when items arrive."
          },
          {
            "type": "note",
            "text": "Before you [request moving quotes](/get-quotes/), decide which destination tasks you want. Keep the room-by-room matrix for companies that contact you, and ask them to confirm unpacking, placement, assembly and packaging removal separately. Do not assume the form itself books any of those tasks."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Is unpacking usually part of a basic move?",
        "answer": "It depends on the provider and the written scope. Do not assume it is included. Ask whether carton opening, item placement, assembly and packaging removal are each included, optional or excluded, and have the answer written down."
      },
      {
        "question": "Will the provider take away my empty boxes?",
        "answer": "Not necessarily. Some providers may remove packaging, others may not, and arrangements can differ by material and timing. Ask which materials, on which day, and whether any limit or charge applies. Do not assume recycling or disposal is offered."
      },
      {
        "question": "Can I add unpacking after the shipment has been loaded?",
        "answer": "For interstate household-goods moves, 49 CFR 375.401 permits estimate amendments before loading by mutual agreement and does not permit amending an estimate after loading. Decide on destination services before loading. For other types of moves, ask the provider how changes are handled."
      },
      {
        "question": "What should I do if I only want some rooms unpacked?",
        "answer": "List those rooms in your matrix and mark the rest as sealed placement only or not requested. A room-by-room scope with clear completion criteria makes it easier to compare responses and check the work afterward."
      }
    ],
    "related": [
      "service:packing",
      "question:how-much-does-packing-cost",
      "planning:delivery-day-checklist"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "question",
    "slug": "minimum-charges-on-small-moving-quotes",
    "primaryKeyword": "moving company minimum charge",
    "intent": "commercial",
    "supportingKeywords": [],
    "title": "How Minimum Charges Affect a Small Moving Quote",
    "h1": "How do minimum charges affect a small moving quote?",
    "metaDescription": "Compare a small move's stated billing minimum, travel fees and included services using a quote-by-quote worksheet, without assuming a typical charge.",
    "answer": "If a quote includes a minimum charge, read it as the billing floor defined in that document, not as the full description of the job. Compare the stated unit, minimum, additional fees, included work and written total for the same shipment. For interstate household-goods moves, the cited federal provision requires a written estimate covering transportation and related services.",
    "sections": [
      {
        "heading": "Identify the quoted billing unit and minimum",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Start by finding out what the quote is actually measuring. Some quotes are built around time, some around weight or volume, and some around a flat amount for a defined scope. A minimum is the smallest amount of that unit the company will bill, however little the job turns out to need. If a small apartment or a few large items would use less than the floor, the floor can matter more than the rate."
          },
          {
            "type": "paragraph",
            "text": "This guide does not give a typical minimum, because none is established here and no fixed legal minimum is assumed. Treat every number as belonging only to the quote in front of you. Your own figures are what count."
          },
          {
            "type": "list",
            "items": [
              "Write down the billing unit each company uses (for example hours, weight, volume or a flat scope).",
              "Write down the minimum for that unit, exactly as the company states it.",
              "Note the rate that applies above the minimum, if any.",
              "Ask whether the minimum is part of the total or a separate line."
            ],
            "ordered": true
          },
          {
            "type": "note",
            "text": "Two quotes with different units cannot be compared by rate alone. A low rate with a high floor may cost more than a higher rate with a low floor on the same small shipment."
          }
        ]
      },
      {
        "heading": "Separate travel and service fees",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Check whether the stated minimum covers the entire job or only named parts of it. Ask about travel to pickup, loading, unloading, the truck, packing materials and additional labor. Record each item as included, extra, not offered or not yet stated; do not infer the answer from an empty line."
          },
          {
            "type": "paragraph",
            "text": "Pay particular attention to services that small moves commonly involve, such as stairs, long carries from the door to the truck, bulky or heavy pieces, disassembly and reassembly, and parking limits at either address. Whether any of these changes the price depends on the company and its written terms. This article does not assume how any provider handles them."
          },
          {
            "type": "list",
            "items": [
              "Travel or trip charges: included in the minimum, billed separately, or not applicable?",
              "Packing materials: included, extra, or your responsibility?",
              "Stairs, long carries or elevators: how are they handled in the written terms?",
              "Special items: are large or fragile pieces covered in the stated scope?",
              "Anything the quote says is excluded."
            ]
          }
        ]
      },
      {
        "heading": "Ask how unused quoted time or capacity is treated",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A minimum raises a practical question: what happens if the job takes less than the quote assumed? The answer differs by company and by quote type, so ask directly and get it in writing. The same question applies to space. If you are quoted a certain amount of truck space or weight and use less, find out whether the price changes."
          },
          {
            "type": "paragraph",
            "text": "Ask the opposite question too. If the job runs over the quoted time, or the shipment turns out larger than described, how is the extra billed, and is it at the same rate? A quote that is cheap only when everything goes perfectly is not necessarily cheaper."
          },
          {
            "type": "list",
            "items": [
              "If the work finishes under the minimum, is the minimum still billed in full?",
              "If it runs over, what rate applies and in what increments?",
              "Is quoted truck space or weight a ceiling, a floor or just an estimate?",
              "Who decides when the job is done, and how is that recorded?"
            ]
          }
        ]
      },
      {
        "heading": "Use a blank comparison worksheet",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Copy the table below into a note or spreadsheet and fill one column per company. This is an editorial worksheet, not a regulator form. Its purpose is to put different billing floors and included work side by side for the same shipment."
          },
          {
            "type": "table",
            "caption": "Minimum charge versus included services (fill in from each written quote)",
            "columns": [
              "Field",
              "Quote A",
              "Quote B",
              "Quote C"
            ],
            "rows": [
              [
                "Billing unit (hours, weight, volume, flat scope)",
                "Record the stated unit",
                "Record the stated unit",
                "Record the stated unit"
              ],
              [
                "Stated minimum",
                "Record the stated minimum",
                "Record the stated minimum",
                "Record the stated minimum"
              ],
              [
                "Rate above the minimum",
                "Ask the rate and any increments",
                "Ask the rate and any increments",
                "Ask the rate and any increments"
              ],
              [
                "Travel or trip fee",
                "Ask whether included or separate",
                "Ask whether included or separate",
                "Ask whether included or separate"
              ],
              [
                "Loading and unloading included?",
                "Confirm both labor tasks",
                "Confirm both labor tasks",
                "Confirm both labor tasks"
              ],
              [
                "Packing materials included?",
                "Ask which materials are included",
                "Ask which materials are included",
                "Ask which materials are included"
              ],
              [
                "Stairs, long carry or special-item terms",
                "Record the applicable terms",
                "Record the applicable terms",
                "Record the applicable terms"
              ],
              [
                "Treatment of unused time or capacity",
                "Ask how unused amounts are treated",
                "Ask how unused amounts are treated",
                "Ask how unused amounts are treated"
              ],
              [
                "Treatment of overage",
                "Ask how extra work is handled",
                "Ask how extra work is handled",
                "Ask how extra work is handled"
              ],
              [
                "Items listed as excluded",
                "List the written exclusions",
                "List the written exclusions",
                "List the written exclusions"
              ],
              [
                "Full written total for this shipment",
                "Record the written total",
                "Record the written total",
                "Record the written total"
              ]
            ]
          },
          {
            "type": "note",
            "text": "Describe the same shipment to every company: same inventory, same addresses, same access conditions and same dates. If the inputs differ, the totals are not comparable."
          }
        ]
      },
      {
        "heading": "Compare the full written total for the same job",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Once the worksheet is filled in, compare totals and scope together. FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total ([FMCSA Moving Checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist)). For a small move this matters even more, because a minimum can make two quotes with different headline rates land close together, or far apart, depending on what each includes."
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services ([49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401)). The same section permits estimate amendments before loading by mutual agreement, and it does not permit amending an estimate after loading. That is a reason to settle questions about minimums, extra services and inventory changes before the crew starts loading, not afterward."
          },
          {
            "type": "paragraph",
            "text": "That federal text is limited to interstate household-goods transport. This article does not say how it applies to a local or labor-only job. For those, ask each company how its written document handles scope, minimums and changes, and keep that document."
          },
          {
            "type": "paragraph",
            "text": "Also confirm the practical details. FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move. For a small job, write down who you call on moving day, how arrival is confirmed and how changes to the scope would be communicated."
          },
          {
            "type": "list",
            "items": [
              "Check that every quote is written and describes the same shipment.",
              "Fill in the worksheet from the documents, not from conversation memory.",
              "Mark each blank as a question to send back to the company.",
              "Compare totals only after the included work is aligned.",
              "Resolve scope or price changes before loading begins."
            ],
            "ordered": true
          }
        ]
      },
      {
        "heading": "Request quotes for your exact shipment",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Prepare the same inventory, route, access details and service list before you [request moving quotes](/get-quotes/). Keep the billing-minimum worksheet for companies that contact you, then compare the written floor and included work for that exact shipment."
          },
          {
            "type": "paragraph",
            "text": "For related planning questions, see [how moving companies charge](/questions/how-do-moving-companies-charge/), [local moving costs](/questions/how-much-do-local-movers-cost/) and [comparing moving estimates](/questions/how-to-compare-moving-estimates/)."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "What is a minimum charge on a moving quote?",
        "answer": "It is the smallest amount a company will bill under its quoted unit, such as time, weight or a defined scope. Ask each company how its minimum is defined and what work it includes, and get the answer in writing."
      },
      {
        "question": "Is there a standard minimum I should expect?",
        "answer": "No typical figure is established in this guide. Read the minimum stated in the specific quote and ask how it is defined, what it covers and which additional terms apply. Compare those answers for your own shipment rather than relying on a general figure."
      },
      {
        "question": "Can a mover change an interstate estimate after loading?",
        "answer": "For interstate household-goods moves, 49 CFR 375.401 permits amendments before loading by mutual agreement and does not permit amending an estimate after loading. Raise any scope questions before the crew loads."
      },
      {
        "question": "Why compare more than the total?",
        "answer": "FMCSA recommends comparing the services provided, not only the quoted total. Two totals can look alike while covering different travel, packing, loading or other work, so check what each one includes."
      }
    ],
    "related": [
      "question:how-do-moving-companies-charge",
      "question:how-much-do-local-movers-cost",
      "question:how-to-compare-moving-estimates"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "question",
    "slug": "travel-time-and-truck-fees-in-hourly-moving-quotes",
    "primaryKeyword": "moving company travel time charge",
    "intent": "commercial",
    "supportingKeywords": [],
    "title": "Travel Time and Truck Fees in Hourly Moving Quotes",
    "h1": "What are travel-time and truck fees in a moving quote?",
    "metaDescription": "Learn how to ask when an hourly moving clock starts and stops, and whether truck, travel and crew time are priced separately, using a simple quote timeline.",
    "answer": "Travel-time and truck lines explain which parts of an hourly quote concern the drive, vehicle and crew. Ask each provider to define the billing start, stop and included work in writing rather than inferring them from the hourly figure. Record pickup, driving, delivery and any separate vehicle charge on a timeline, then compare those definitions for your own shipment.",
    "sections": [
      {
        "heading": "Separate working time from quoted travel",
        "blocks": [
          {
            "type": "paragraph",
            "text": "An hourly rate sounds simple, but the number only means something once you know which minutes are billed. Some quotes count only time spent loading and unloading. Others include time on the road, time before arrival, or a separate line for the vehicle. Terms vary by provider, so treat each quote as its own definition rather than assuming a standard."
          },
          {
            "type": "paragraph",
            "text": "Start by sorting the quote's language into three buckets: working time (labor at the homes), travel time (the drive between locations or from a provider's base) and vehicle charges (the truck or equipment). A quote may combine them into one hourly figure, list them separately, or leave one unmentioned. An unmentioned item is a question to ask, not a sign that it costs nothing."
          },
          {
            "type": "note",
            "text": "This guide does not establish a legal clock rule or standard travel fee for a local move. Ask which written terms and applicable state requirements the provider relies on. Do not read the interstate estimate provision below as a local billing rule."
          }
        ]
      },
      {
        "heading": "Ask how truck and crew costs are listed",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Two quotes with the same hourly number can describe different services. One may include the truck and a crew of a stated size. Another may price the crew by the hour and add the truck as a separate fee. Ask each provider to spell out how the pieces are listed."
          },
          {
            "type": "list",
            "items": [
              "Is the truck included in the hourly rate, or is it a separate line?",
              "Does the rate cover a specific number of movers, and how does it change if the crew size changes?",
              "Are fuel, mileage or equipment such as dollies and pads listed, included or excluded?",
              "Is there a minimum number of billed hours, and what does it cover?",
              "Are travel and vehicle charges billed once, or for each leg of the move?"
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "FMCSA recommends getting several estimates and comparing the services provided, not only the quoted total ([FMCSA Moving Checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist)). Listing truck, crew and travel lines side by side makes that comparison possible. For broader background on how providers structure charges, see [how moving companies charge](/questions/how-do-moving-companies-charge/) and [how much local movers cost](/questions/how-much-do-local-movers-cost/)."
          }
        ]
      },
      {
        "heading": "Build a provider-defined timeline",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The worksheet below is an editorial suggestion, not a regulator form. Copy it for each provider and fill in the provider's own answers. The goal is to see where the billed clock begins and ends, and what happens between those points."
          },
          {
            "type": "table",
            "caption": "Quote timeline worksheet (fill in one per provider)",
            "columns": [
              "Timeline point",
              "Question to ask",
              "What to record"
            ],
            "rows": [
              [
                "Clock start",
                "What event starts billing: leaving a base, arriving at pickup, or starting to load?",
                "Provider's wording and the event named"
              ],
              [
                "Pickup",
                "Is loading time billed as labor only, and does it include any wrap or prep work?",
                "Services listed and any exclusions"
              ],
              [
                "Drive",
                "Is travel between addresses billed at the same rate, a different rate, or a flat charge?",
                "Rate or fee, and whether it is stated as a range"
              ],
              [
                "Delivery",
                "Does unloading time continue at the same hourly rate? Are placement and setup included?",
                "Services listed and any exclusions"
              ],
              [
                "Clock stop",
                "What event ends billing: last item off the truck, or return to a base?",
                "Provider's wording and the event named"
              ],
              [
                "Truck and equipment",
                "Is the vehicle in the rate or a separate line?",
                "Line item or note that it is included"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "If a provider cannot answer a row, write \"not stated\" and ask for it in the written quote. A blank row is useful information when you compare."
          }
        ]
      },
      {
        "heading": "Record route, waiting and access assumptions",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Hourly quotes depend on assumptions about the day. Write down the assumptions each provider used so you can tell whether a later change is yours or theirs to explain."
          },
          {
            "type": "list",
            "items": [
              "Route: which addresses are included, and whether any stop between them is expected.",
              "Waiting: how the provider treats delays such as a late key handoff, an elevator reservation or a parking wait, and whether the clock keeps running.",
              "Access: stairs, long carries, narrow halls, parking distance and building rules that could slow loading.",
              "Item list: the inventory or room count used for the quote, and how the provider would reassess its time assumptions if that list changes.",
              "Contacts: who will be reachable at each address during the move."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "FMCSA also recommends establishing pickup and delivery arrangements and how to reach the provider before, during and after the move ([FMCSA Moving Checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist)). Add a line on the worksheet for the contact method and the person responsible on moving day. The [estimate service inclusions checklist](/planning/estimate-service-inclusions-checklist/) can help you confirm what each estimate covers."
          }
        ]
      },
      {
        "heading": "Check the provider-defined total and terms",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Before you accept a quote, read the total against your worksheet. Does the arithmetic follow the clock definitions you recorded? Does the written document name the same crew size, vehicle and services the provider described aloud? If anything differs, ask for a corrected document rather than relying on a conversation."
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, [49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401) requires a written estimate covering transportation and related services. The same section permits estimate amendments before loading by mutual agreement, and it does not permit amending an estimate after loading. That is a federal rule for interstate moves only. It should not be read as the rule for a local or labor-only job, where the provider's written terms and your state's rules apply."
          },
          {
            "type": "note",
            "text": "Whatever type of move you have, agree to any change to the clock, crew, truck or services before loading starts, and keep the revised terms in writing."
          }
        ]
      },
      {
        "heading": "Describe your move and compare like for like",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Before you [request moving quotes](/get-quotes/), gather your real route, inventory and access details. When a company contacts you, use the timeline to ask when its clock starts and stops and where travel, vehicle and crew charges appear in its written quote. Keep each company's definitions separate until you compare the full scope."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Is travel time always billed in an hourly moving quote?",
        "answer": "Not necessarily. Some providers bill it at the hourly rate, some charge a separate travel or vehicle fee, and some fold it into a rate. Ask each provider to state in writing whether travel is billed and how."
      },
      {
        "question": "Should the truck be included in the hourly rate?",
        "answer": "It depends on the provider. Ask whether the truck is part of the rate or a separate line, and compare quotes only after you have put them in the same format."
      },
      {
        "question": "Can a moving estimate change after the movers start loading?",
        "answer": "For interstate household-goods moves, 49 CFR 375.401 permits estimate amendments before loading by mutual agreement and does not permit amending an estimate after loading. For local moves, check the provider's written terms and your state's rules."
      },
      {
        "question": "What should I do if a provider will not define when the clock starts and stops?",
        "answer": "Record the answer as not stated and ask for the definition in the written quote. If it stays unclear, you can weigh that when comparing providers."
      }
    ],
    "related": [
      "question:how-much-do-local-movers-cost",
      "question:how-do-moving-companies-charge",
      "planning:estimate-service-inclusions-checklist"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "question",
    "slug": "moving-between-apartments-in-the-same-building",
    "primaryKeyword": "same building movers",
    "intent": "commercial",
    "supportingKeywords": [],
    "title": "Hiring Movers for a Same-Building Apartment Move: A Transfer Plan",
    "h1": "Can I hire movers for a move within the same building?",
    "metaDescription": "Moving between units in one building? Define floors, elevator use, furniture prep and handling tasks, then compare written scopes even when no truck is needed.",
    "answer": "Ask whether a company quotes handling between two units without a truck or road travel; do not assume it accepts that work. Prepare a from-unit/to-unit plan covering floors, elevator use, furniture preparation and placement. Give each provider the same item list and access description, then compare the written tasks and responsibilities rather than treating it as a standard truck move.",
    "sections": [
      {
        "heading": "Start by describing the transfer without assuming a truck",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Most moving advice pictures a truck at a curb. A move between two units in the same building may need no truck at all. The work is handling: wrapping, carrying, riding elevators or taking stairs, and placing items in the new unit. Some companies may offer this kind of service and some may not, so treat it as a question to ask rather than something to expect."
          },
          {
            "type": "paragraph",
            "text": "Describe the job in plain terms: 'Move the contents of one apartment to another unit in the same building, with no road travel.' That wording stops a provider from quoting a standard truck job by default and lets you see whether the company handles this type of request."
          },
          {
            "type": "note",
            "text": "Do not apply an interstate household-goods estimate rule automatically to an in-building transfer. The worksheet and service questions below are planning recommendations; confirm the terms for your actual job with the provider and building management."
          }
        ]
      },
      {
        "heading": "Record both unit layouts and elevator controls",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The core of your request is a from-unit/to-unit access and item-transfer plan. Fill in the table below before you contact anyone. It can be a note on your phone; what matters is that every provider hears the same details."
          },
          {
            "type": "table",
            "caption": "From-unit/to-unit access and transfer plan (editorial worksheet)",
            "columns": [
              "Detail",
              "From unit",
              "To unit"
            ],
            "rows": [
              [
                "Floor and unit number",
                "Record the current unit and floor",
                "Record the new unit and floor"
              ],
              [
                "Route to elevator or stairs (distance, turns, hallway width)",
                "Describe the route leaving the unit",
                "Describe the route into the unit"
              ],
              [
                "Elevator type (passenger or service) and any key, code or reservation",
                "Ask management about access and reservations",
                "Confirm whether the same reservation covers this floor"
              ],
              [
                "Door widths and tight corners",
                "Note measurements and tight turns",
                "Note destination measurements and tight turns"
              ],
              [
                "Large or fragile items (sofa, bed frames, mirrors, appliances)",
                "List pieces leaving this unit",
                "Confirm rooms and intended placement"
              ],
              [
                "Items that need disassembly or reassembly",
                "List preparation tasks to discuss",
                "Confirm the rebuilding tasks requested"
              ],
              [
                "Floor protection needed (hallway, elevator, new unit)",
                "Ask management what protection is required",
                "Confirm protection and who supplies it"
              ],
              [
                "Rooms where items will be placed",
                "Label the pieces by destination room",
                "Record the receiving room for each group"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Walk the route without moving heavy items as a test. Note dimensions, tight turns and shared elevator access, and show those details to the provider so it can assess the handling plan."
          }
        ]
      },
      {
        "heading": "Decide what you will prepare and what you want the crew to do",
        "blocks": [
          {
            "type": "paragraph",
            "text": "With a short distance, it is tempting to carry boxes yourself and hire help only for heavy furniture. That can be a reasonable split, but spell it out. A provider cannot price or schedule the job well if the division of labor is vague."
          },
          {
            "type": "list",
            "items": [
              "Packing: will you pack everything, or do you want help with some rooms or fragile items?",
              "Furniture: which pieces need disassembly, wrapping or reassembly, and who handles hardware?",
              "Contents: can drawers stay filled, or must they be emptied first?",
              "Carrying: should the crew carry loose items, or only boxed goods and furniture?",
              "Placement: do you want furniture set in specific spots, or just brought into the room?",
              "Cleanup: who removes packing material and protects floors afterward?"
            ],
            "ordered": false
          }
        ]
      },
      {
        "heading": "Ask about preparation, crew and equipment",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Because no truck is involved, the useful questions are about people and tools. Ask each provider the same set so the answers are comparable."
          },
          {
            "type": "list",
            "items": [
              "Do you take moves within a single building, and is there any minimum job size?",
              "How many people will come, and how long do you expect the job to take?",
              "What equipment will you bring, such as dollies, carts, pads or floor protection?",
              "Will you disassemble and reassemble furniture, and is that part of the estimate?",
              "How will you handle the elevator or stairs given the route I described?",
              "Who is the contact on the day, and how do I reach you before, during and after the move?"
            ],
            "ordered": true
          },
          {
            "type": "note",
            "text": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move. That guidance addresses interstate household-goods moves, but the same contact question is a sensible one to ask for a short in-building job."
          }
        ]
      },
      {
        "heading": "Compare written scopes, not just totals",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the total. Treat those planning questions as a useful habit here, not as an interstate legal requirement for this job. FTC recommends written estimates describing the property being moved and comparing them; ask for the same clarity about your in-building transfer."
          },
          {
            "type": "paragraph",
            "text": "Check that each written estimate names both units or floors, the access route, the furniture tasks and the items you listed. If one estimate leaves out disassembly or elevator handling that another includes, the totals are not comparable. Ask the provider to add the missing detail in writing."
          },
          {
            "type": "paragraph",
            "text": "Be cautious about demands for cash or a large deposit before the move. The FTC warns against this. Its guidance does not set a universal legal deposit limit or refund deadline, so ask what any deposit covers and get the terms in writing before you pay."
          }
        ]
      },
      {
        "heading": "Confirm the service scope with building management",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Even without a truck, a building may have its own rules. Ask management whether you must reserve the elevator, whether there are permitted hours, and whether movers must provide proof of insurance or register with the office. Rules vary by building, so ask rather than assume."
          },
          {
            "type": "list",
            "items": [
              "Elevator reservation and time windows",
              "Required protection for walls, floors and elevator interiors",
              "Any deposit or fee the building itself charges",
              "Rules for hallways, shared spaces and loading access",
              "Whether the lease or house rules require approval for contractors"
            ]
          },
          {
            "type": "paragraph",
            "text": "Share management's confirmed instructions with each provider so its estimate describes the same access conditions. Keep stairs, elevator use, carry routes and protection tasks on your transfer plan. The [local moving services overview](/services/local/) offers related context; ask the company which handling-only work it accepts for this building."
          }
        ]
      },
      {
        "heading": "Describe the job in the quote survey",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Before you [request moving quotes](/get-quotes/), prepare the two-unit transfer plan and your real route information. Keep the floor, elevator and handling details for the companies that contact you, and ask directly whether they accept the specific in-building work before booking."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FTC recommends written estimates describing the property being moved and comparing the estimates.",
                "source": {
                  "label": "FTC: Avoid scams when you hire a moving company",
                  "url": "https://consumer.ftc.gov/consumer-alerts/2024/09/avoid-scams-when-you-hire-moving-company",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FTC warns against demands for cash or a large deposit before a move. Its guidance does not set a universal legal deposit limit or refund deadline.",
                "source": {
                  "label": "FTC: Avoid scams when you hire a moving company",
                  "url": "https://consumer.ftc.gov/consumer-alerts/2024/09/avoid-scams-when-you-hire-moving-company",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FTC: Avoid scams when you hire a moving company",
        "url": "https://consumer.ftc.gov/consumer-alerts/2024/09/avoid-scams-when-you-hire-moving-company",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Do I need a truck to hire movers for a same-building move?",
        "answer": "For a transfer entirely inside one building, describe whether any vehicle work is needed and ask the company whether it accepts handling-only work. Do not assume a standard truck quote covers your plan or that every company will accept a no-road-travel job."
      },
      {
        "question": "Will every moving company accept a labor-only move inside one building?",
        "answer": "Not necessarily. Some may decline short or labor-only jobs. Ask each provider directly whether they handle in-building moves and whether they have a minimum before you rely on them."
      },
      {
        "question": "Do federal moving rules apply to a move between units in the same building?",
        "answer": "Do not automatically apply an interstate household-goods estimate provision to an in-building transfer. The worksheets here are planning suggestions, and the cited FTC material is consumer moving guidance. Ask the provider and building management about the terms for your specific job."
      },
      {
        "question": "What should a written estimate include for this kind of move?",
        "answer": "It should describe the property being moved, both units or floors, the access route and elevator use, and the tasks included, such as disassembly, wrapping and placement. Comparing these details across estimates is more useful than comparing totals alone."
      },
      {
        "question": "Should I pay a deposit before the move?",
        "answer": "Be wary of demands for cash or a large deposit before a move, as the FTC warns. Its guidance sets no universal legal deposit limit or refund deadline, so ask what a deposit covers and get the terms in writing."
      }
    ],
    "related": [
      "planning:moving-from-an-apartment-checklist",
      "question:do-movers-charge-for-stairs-and-long-carries",
      "service:local"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "self-storage-unit-to-home-moving-checklist",
    "primaryKeyword": "storage unit movers checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Storage Unit to Home Moving Checklist: Access and Inventory Worksheet",
    "h1": "Storage unit to home moving checklist",
    "metaDescription": "Prepare a privately rented storage unit, gate access, item list and delivery details before a separate moving service picks up your belongings and brings them home.",
    "answer": "A self-storage move goes more smoothly when the moving company knows who can open the unit, when the gate allows access, what is inside and where it is going. Complete a one-page access and inventory worksheet before requesting estimates, then compare the services each company describes in writing, not only the total. This guide covers a unit you rent yourself, not mover-held storage.",
    "sections": [
      {
        "heading": "Start with who can open the gate and the unit",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Before scheduling a pickup from a unit you rent, ask the storage facility who may enter, open the unit and authorize removal. Confirm the arrangement with the moving company as well. The worksheet below suggests what to record; it does not state the facility's rules."
          },
          {
            "type": "table",
            "caption": "Gate and access handoff",
            "columns": [
              "Item to record",
              "What to write down",
              "Why it matters"
            ],
            "rows": [
              [
                "Access hours",
                "Gate hours and office hours on the planned day, including any early or late limits",
                "A crew arriving outside gate hours may not be able to start"
              ],
              [
                "Authorized person",
                "Name of the account holder and anyone else allowed to enter or release items",
                "Clarifies who can open the unit and approve removal"
              ],
              [
                "Gate code or escort",
                "Whether a code, key, lock or staff escort is needed, and who will supply it",
                "Avoid sharing codes more widely than necessary"
              ],
              [
                "Lock type",
                "Padlock, facility lock or other, and who holds the key",
                "Prevents delays at the door"
              ],
              [
                "Day-of contact",
                "A phone number for you and for the facility office",
                "Gives everyone a way to resolve problems quickly"
              ],
              [
                "Facility notice",
                "Whether the facility wants advance notice of a moving truck",
                "Some sites may ask for it; confirm rather than assume"
              ]
            ]
          },
          {
            "type": "note",
            "text": "If someone other than you will be at the unit, ask the facility how it wants that person authorized, and keep any written confirmation with your worksheet."
          }
        ]
      },
      {
        "heading": "List the unit contents and packaging condition",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Visit the unit before requesting estimates if you can and record what you can verify. Count boxes by type and size, list large pieces individually, and mark anything hidden or uninspected as unknown rather than guessing its condition."
          },
          {
            "type": "table",
            "caption": "Unit inventory worksheet (editorial template)",
            "columns": [
              "Item group",
              "Approximate count or size",
              "Packaging condition",
              "Handling notes"
            ],
            "rows": [
              [
                "Boxes",
                "Number and small, medium or large",
                "Sealed, taped, labeled, or open",
                "Heavy boxes, fragile contents"
              ],
              [
                "Large furniture",
                "Sofas, beds, tables, dressers",
                "Wrapped, bare or disassembled",
                "Items that need disassembly or have hardware missing"
              ],
              [
                "Appliances",
                "Type and size",
                "Record current condition; ask which preparation the mover accepts",
                "Anything needing special handling"
              ],
              [
                "Loose or odd-shaped items",
                "Bikes, tools, outdoor gear, mirrors",
                "Covered, bundled or loose",
                "Sharp edges, awkward shapes"
              ],
              [
                "Items stacked at the back",
                "Describe what is blocked",
                "Condition unknown until moved",
                "May need extra time to reach"
              ],
              [
                "Items not coming home",
                "Donate, sell or discard",
                "Not applicable",
                "Keep separate so they are not loaded by mistake"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Take dated photos of the full unit and of any damaged, valuable or fragile pieces. Note what is already damaged, such as scratches, moisture marks or broken hardware, so you can compare it with the condition at delivery."
          }
        ]
      },
      {
        "heading": "Describe truck access and loading restrictions",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Storage sites vary a great deal in how a truck can reach a unit. Describe what you actually see rather than guessing. These are details worth passing to every company you contact:"
          },
          {
            "type": "list",
            "items": [
              "Unit location: ground-level drive-up, indoor hallway, upper floor or climate-controlled building.",
              "Elevator, ramp or stairs, and whether a cart or dolly is available on site.",
              "Distance from the nearest parking spot or loading area to the unit door.",
              "Narrow lanes, tight turns, low clearances or gate limits that could affect a large truck.",
              "Any facility limits on loading time, truck size or noise that you have confirmed.",
              "The destination's access: stairs, elevator, long carry, parking limits or building reservation requirements."
            ]
          },
          {
            "type": "paragraph",
            "text": "If you are unsure whether a truck can reach the unit, ask the facility and note the answer with the date and the person who gave it. A company can only plan around restrictions it knows about."
          }
        ]
      },
      {
        "heading": "Document release, pickup and delivery responsibilities",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Because the storage unit is rented separately from the moving service, responsibilities can blur. A short written split helps. This is a recommended worksheet, not a legal form."
          },
          {
            "type": "table",
            "caption": "Responsibility handoff",
            "columns": [
              "Task",
              "Who handles it",
              "Confirmed in writing?"
            ],
            "rows": [
              [
                "Opening the gate and unit",
                "You, a designee or facility staff",
                "Yes / No"
              ],
              [
                "Releasing items to the crew",
                "Named authorized person",
                "Yes / No"
              ],
              [
                "Checking the item list against what is loaded",
                "You or your designee, with the crew",
                "Yes / No"
              ],
              [
                "Packing or wrapping before pickup",
                "You or the moving company",
                "Yes / No"
              ],
              [
                "Delivery address, access and contact person",
                "You",
                "Yes / No"
              ],
              [
                "Ending or changing the unit rental",
                "You and the facility",
                "Yes / No"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move ([FMCSA Moving Checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist)). For a storage pickup, that means agreeing on who calls whom if the gate fails, the lock will not open or the crew is running late."
          }
        ]
      },
      {
        "heading": "Compare written estimates and keep changes before loading",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total ([FMCSA Moving Checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist)). Give each company the same worksheet so the descriptions match, then check whether each estimate reflects the unit location, the access limits, any packing, and the delivery address."
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services ([49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401)). The same section permits estimate amendments before loading by mutual agreement, and it does not permit amending an estimate after loading. Local moves and labor-only help may be handled under different terms, so ask each company which terms apply to your job."
          },
          {
            "type": "paragraph",
            "text": "In practical terms, if you discover extra items, a second unit or a harder access point, raise it before loading day, not at the unit door."
          },
          {
            "type": "note",
            "text": "This worksheet covers a self-storage unit you rent, not a mover-held storage arrangement. Read the facility and moving-service documents separately and do not assume insurance, custody or liability carries over between them. The [storage redelivery readiness checklist](/planning/storage-redelivery-readiness-checklist/) addresses planning for mover-held goods."
          }
        ]
      },
      {
        "heading": "Use the worksheet when you request quotes",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Before you [request moving quotes](/get-quotes/), gather the real storage-to-home route, item list and requested services. Keep the access and handoff worksheets for companies that contact you, and confirm who may release the contents and what the crew is expected to collect."
          },
          {
            "type": "paragraph",
            "text": "If the goods may leave the unit before your new home is ready, list that gap as an open timing question. Ask who would hold the goods, which later-delivery tasks would be needed and how any accepted arrangement would be documented. Do not assume storage or redelivery is included in the pickup."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Is moving from a self-storage unit the same as storage-in-transit?",
        "answer": "No. This worksheet concerns a unit you rent separately and a moving service you arrange to collect its contents. Keep that facility agreement distinct from any mover-held storage arrangement, and do not assume the same insurance, custody or liability terms apply."
      },
      {
        "question": "Does someone need to be at the unit during pickup?",
        "answer": "As an editorial recommendation, yes: have you or a clearly authorized person there to open the gate and unit, release items and check the list. Ask the facility how it wants authorization handled and keep any confirmation in writing."
      },
      {
        "question": "What if I find more items after I get an estimate?",
        "answer": "Tell the company before loading and ask for the change in writing. For interstate household-goods moves, 49 CFR 375.401 permits estimate amendments before loading by mutual agreement and does not permit amending an estimate after loading."
      },
      {
        "question": "What should I compare besides the total price?",
        "answer": "FMCSA recommends comparing the services provided, not only the total. Check whether each estimate covers the storage pickup, packing, access difficulty, delivery details and how you will reach the company before, during and after the move."
      }
    ],
    "related": [
      "planning:storage-redelivery-readiness-checklist",
      "planning:moving-with-a-storage-gap",
      "question:what-is-storage-in-transit"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "last-minute-household-move-quote-checklist",
    "primaryKeyword": "last minute moving checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Last-Minute Move Quote Checklist and Dependency Register",
    "h1": "Last-minute move quote checklist",
    "metaDescription": "Build a complete urgent household move request, confirm key details today, and plan a fallback before you accept any offer that is not documented in writing.",
    "answer": "For an urgent move, write down the real move-out and receiving deadlines, a short item and service list, access details, and who can act if you cannot be present. Then ask every provider the same questions and compare the services in writing. Do not accept an offer that is verbal, incomplete, or leaves a key dependency unresolved.",
    "sections": [
      {
        "heading": "Confirm the real deadlines first",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Urgency often hides two separate clocks: when you must be out of the current place, and when you can actually receive belongings at the new one. Providers can only respond usefully if you separate them. Before contacting anyone, write both down and mark which are fixed and which have some give."
          },
          {
            "type": "table",
            "caption": "Deadline worksheet (an editorial suggestion, not a regulatory form)",
            "columns": [
              "Deadline",
              "What to write down",
              "Fixed or flexible?"
            ],
            "rows": [
              [
                "Move-out",
                "Last day and time you can access the current home, including any building or lease limits",
                "Note who set the limit"
              ],
              [
                "Receiving",
                "Earliest and latest day you can accept belongings at the new place",
                "Note what controls it, such as keys or a building schedule"
              ],
              [
                "Gap between the two",
                "Whether you need belongings held, or can accept a delivery window instead of a fixed time",
                "Be honest about what you can tolerate"
              ],
              [
                "Your availability",
                "Days and hours you can be present for loading and unloading",
                "Name a stand-in if you cannot be there"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Avoid guessing at dates. If you are unsure whether a building will allow a move on a given day, put that in the dependency register below instead of presenting it to providers as settled."
          }
        ]
      },
      {
        "heading": "Write a short item and service list",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Prepare a one-page item and service summary for direct conversations with providers. You do not need a perfect inventory to start preparing, but aim for a description that two different providers would read the same way."
          },
          {
            "type": "list",
            "items": [
              "Home size and the main rooms involved, plus any storage areas, garages or outbuildings.",
              "Large or awkward items: pianos, safes, gym equipment, oversized furniture, items that need disassembly.",
              "Boxes already packed versus items still needing packing, and whether you want packing help.",
              "Services you want: loading, unloading, transport, packing, disassembly and reassembly, storage, or a combination.",
              "Access at both ends: stairs, elevators, long carries, parking limits, narrow entries, and any building rules you know about.",
              "Anything you will move yourself, such as documents, medication, valuables and items needed on the first night."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "If something is uncertain, say so in the list. A note such as \"unsure if the sofa fits through the door\" is more useful to a provider than a confident guess."
          }
        ]
      },
      {
        "heading": "The must-confirm-today list",
        "blocks": [
          {
            "type": "paragraph",
            "text": "When time is short, the risk is not only a missed date. It is also accepting something that was never written down. Ask every provider the same questions so the answers are comparable. The list below is an editorial recommendation to adapt to your move."
          },
          {
            "type": "list",
            "items": [
              "Which dates and time windows can you actually offer for pickup, and for delivery? Is each one confirmed or only possible?",
              "What exactly does the offer include: labor, packing, materials, disassembly, transport, storage? What is excluded?",
              "Will you review my item and service list, and does your offer change if the list turns out to be wrong?",
              "Who is my contact before, during and after the move, and how do I reach them?",
              "What documents will I be asked to review or sign, and can I see them before moving day?",
              "What happens if access at either address is delayed or unavailable when your crew arrives?",
              "Can I have the offer, scope and dates in writing before I commit?"
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, the Federal Motor Carrier Safety Administration (FMCSA) recommends [establishing pickup and delivery arrangements and how to contact the provider before, during and after the move](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist). Local or labor-only moves may be handled differently, so ask each provider how its own process works rather than assuming the same rules apply."
          },
          {
            "type": "note",
            "text": "Treat same-day or next-day availability as unconfirmed until a provider accepts your actual shipment and date in writing."
          }
        ]
      },
      {
        "heading": "Compare scope, not only the total",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Under time pressure it is tempting to take the first offer that fits the calendar. For interstate household-goods moves, FMCSA's [moving checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist) recommends obtaining several estimates and comparing the services provided, not only the quoted total. That is sensible for urgent local moves too, as an editorial suggestion."
          },
          {
            "type": "paragraph",
            "text": "Put the offers side by side using the same headings: dates offered, services included, services excluded, access assumptions, contact person and documents to be signed. An offer that is cheaper on paper but leaves out unloading, packing or disassembly may not cover the same job."
          },
          {
            "type": "paragraph",
            "text": "Read the paperwork before moving day if you can. FMCSA's [tips for a successful move](https://www.fmcsa.dot.gov/protect-your-move/tips-for-success) advise reviewing completed shipment documents and not signing blank documents. If a provider asks you to sign something with empty fields because there is no time, treat that as a reason to pause."
          }
        ]
      },
      {
        "heading": "Unresolved-dependency register",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Some pieces will not be settled by the time you need to decide. Instead of hoping they work out, list each one with a fallback and a point at which you will switch. This register is a planning aid of our own, not an official form."
          },
          {
            "type": "table",
            "caption": "Sample register: replace the examples with your own",
            "columns": [
              "Open dependency",
              "Why it matters",
              "Who can resolve it",
              "Fallback if unresolved",
              "Decide by"
            ],
            "rows": [
              [
                "New-home keys or access not confirmed",
                "Delivery cannot happen if no one can enter",
                "Landlord, agent or seller",
                "Ask providers about a later delivery window or holding items; name a person to meet the crew",
                "Before accepting any offer"
              ],
              [
                "Building move rules unknown",
                "Elevator or parking limits can change the timing",
                "Building manager",
                "Ask the provider how access problems are handled and what changes in writing",
                "Before moving day"
              ],
              [
                "Item size or fit uncertain",
                "An incorrect list can change the job",
                "You, after measuring",
                "Flag it to providers and ask how changes are handled",
                "Before signing"
              ],
              [
                "You cannot be present at loading or unloading",
                "Someone should watch the process and check the paperwork",
                "You and a trusted person",
                "Arrange a representative, as below",
                "Before moving day"
              ],
              [
                "Packing not finished",
                "Unpacked items extend the job or may not travel as expected",
                "You or a packing provider",
                "Narrow the move to essentials and ask about add-on services",
                "As soon as the gap is clear"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Plan for someone else to be there",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Urgent moves often collide with work, travel or a gap between homes. FMCSA recommends supervising loading and unloading, or asking a known person to act on your behalf when you are unavailable. That guidance does not establish who has legal authority to sign for you, so ask the provider what it will accept and confirm any such arrangement in writing before moving day."
          },
          {
            "type": "list",
            "items": [
              "Give your stand-in the item list, the written scope and the provider's contact information.",
              "Make sure they know which items are excluded or moving separately.",
              "Ask them to check completed documents carefully and to reach you before anything blank or unclear is signed.",
              "Share a number where you can be reached during the move."
            ],
            "ordered": false
          }
        ]
      },
      {
        "heading": "Sending your request",
        "blocks": [
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep your deadline worksheet and dependency register privately. If a company contacts you, discuss the shipment, access limits and unresolved timing questions directly with that company using your must-confirm list."
          },
          {
            "type": "paragraph",
            "text": "Submitting the form is not a binding quote and does not guarantee availability, price or timing. If a company contacts you, keep your deadline worksheet open and ask it to confirm the details in writing. For longer lead times, see how far in advance to book movers, the 8-week moving timeline and whether a mover has to do a survey."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA advises reviewing completed shipment documents and not signing blank documents.",
                "source": {
                  "label": "FMCSA Tips for a Successful Move",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends supervising loading and unloading, or asking a known person to act on the customer behalf when unavailable. This does not establish legal signing authority.",
                "source": {
                  "label": "FMCSA Tips for a Successful Move",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Tips for a Successful Move",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "What should I do first if my move is only days away?",
        "answer": "Write down your real move-out and receiving deadlines, then prepare a short item and service list with access details at both addresses. Keep that summary for a direct provider conversation. If a company contacts you, use it to ask which arrangements it could accept and confirm in writing."
      },
      {
        "question": "Can I rely on a verbal offer when time is short?",
        "answer": "It is safer not to. Ask for the dates, included services, exclusions and contact details in writing. If an offer cannot be documented before you commit, treat it as unconfirmed and keep comparing."
      },
      {
        "question": "What if I cannot be there for loading or unloading?",
        "answer": "FMCSA recommends supervising loading and unloading or asking a known person to act for you. This does not by itself create legal signing authority, so ask the provider what it accepts and confirm it in writing."
      },
      {
        "question": "Should I sign paperwork quickly to hold a date?",
        "answer": "Take the time to review completed documents. FMCSA advises not signing blank documents for interstate household-goods moves, which is also a sound habit for other moves. If something is incomplete, ask for it to be filled in before you sign."
      }
    ],
    "related": [
      "question:how-far-in-advance-should-i-book-movers",
      "planning:moving-timeline-8-weeks",
      "question:does-a-mover-have-to-do-a-survey"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "uncertain-closing-date-moving-plan-checklist",
    "primaryKeyword": "moving closing date uncertain checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Moving When Your Closing Date Is Uncertain: A Checklist",
    "h1": "Moving when your closing date is uncertain: checklist",
    "metaDescription": "Use a date-confidence and change-notification log to separate target from confirmed dates, assign contacts and confirm mover rescheduling and storage terms in writing.",
    "answer": "Treat a closing date as a target until the people responsible for possession confirm it in writing. Keep a log of how confident each date is, who tells the mover when it changes, and which rescheduling and storage terms are confirmed in writing. For interstate moves, compare written estimates and scope before committing; amendments are possible before loading by mutual agreement.",
    "sections": [
      {
        "heading": "Separate confirmed possession from a target closing date",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A closing date on a contract or calendar is not the same as the day you can actually get into or out of a home. Keys, access and possession can depend on steps outside your control. This article is not real-estate legal advice. Ask your agent, attorney or closing contact what counts as confirmed in your situation."
          },
          {
            "type": "paragraph",
            "text": "Give every date in your plan a confidence label and write down what the label is based on. The labels below are an editorial suggestion, not a regulatory standard."
          },
          {
            "type": "table",
            "caption": "Suggested date-confidence labels",
            "columns": [
              "Label",
              "What it means",
              "Planning implication"
            ],
            "rows": [
              [
                "Target",
                "A hoped-for date that nobody responsible has confirmed",
                "Do not make non-changeable commitments around it"
              ],
              [
                "Likely",
                "The responsible contact expects it but open items remain",
                "Ask movers about flexibility before you book"
              ],
              [
                "Confirmed",
                "The responsible contact has confirmed possession or access in writing",
                "Lock in the pickup or delivery plan"
              ],
              [
                "Changed",
                "A date moved after you had recorded it",
                "Notify the mover and review the written terms"
              ]
            ]
          },
          {
            "type": "note",
            "text": "Record the source and the day you heard it, for example \"agent email, confirmed access.\" A date with no source should stay at Target."
          }
        ]
      },
      {
        "heading": "Record the mover and property contacts",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Date changes cause trouble when nobody knows who is supposed to tell whom. FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move ([FMCSA Moving Checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist)). Your log can extend that idea to the property side."
          },
          {
            "type": "list",
            "items": [
              "Your own lead: one person who relays every date change, so the mover does not get conflicting messages.",
              "Origin contact: the agent, seller, landlord or property manager who can confirm when you must be out or can load.",
              "Destination contact: the agent, attorney, lender contact or landlord who can confirm when you can enter.",
              "Mover contact: a phone number and email for the dispatcher or coordinator, plus a contact for the day of the move.",
              "Backup: someone who can answer calls if you are in a closing meeting or traveling."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "Next to each contact, note the preferred channel. If a company contacts you after an American Moving Choice quote request, add its contact details to the log then. Discuss target versus confirmed dates directly and keep a written copy of date-related messages."
          }
        ]
      },
      {
        "heading": "Request written rescheduling and storage terms",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Before committing, ask each company how it handles a date that moves earlier or later, and get the answer in writing. FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total ([FMCSA Moving Checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist)). With an uncertain date, flexibility terms are part of that comparison."
          },
          {
            "type": "list",
            "items": [
              "What happens to the booking if the pickup date moves, and who must be told?",
              "Is there a fee, a different rate or a new availability check for a changed date? Ask for the answer in writing, not an assumption.",
              "If delivery cannot happen on the planned day, what are the storage options, and are they confirmed for your dates or only possible?",
              "Who handles the goods while in storage, and how are storage charges described?",
              "Does the written estimate list each service, or only a total?",
              "How and by when must you confirm a changed date so the company can plan?"
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services. The same section permits estimate amendments before loading by mutual agreement, and it does not permit amending an estimate after loading ([49 CFR 375.401](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401)). In practice, an uncertain date is best settled before loading day, so ask what must be updated and agreed on beforehand."
          },
          {
            "type": "note",
            "text": "Those federal points are about interstate household-goods transport. Local moves and labor-only services may be handled under different terms, so ask for the provider's rescheduling and storage conditions in writing in either case. Do not assume storage is available or that a fee can be refunded."
          },
          {
            "type": "paragraph",
            "text": "If a gap between pickup and delivery is possible, see moving with a storage gap. For how delivery windows work, read what a moving delivery spread is."
          }
        ]
      },
      {
        "heading": "Set trigger points for each contingency",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A trigger point is a moment when you stop waiting and act on a pre-decided step. Set these in advance so a late change does not force a rushed choice. The triggers below are editorial suggestions. Fill in your own calendar dates based on your contracts and the mover's terms."
          },
          {
            "type": "table",
            "caption": "Example trigger points",
            "columns": [
              "Trigger",
              "Check",
              "Possible action"
            ],
            "rows": [
              [
                "Date still at Target when you are ready to book",
                "Ask the mover about flexibility and what a change involves",
                "Wait, or book only with written change terms"
              ],
              [
                "Responsible contact says the date may slip",
                "Update the log and confidence label",
                "Notify the mover through your single lead"
              ],
              [
                "Date moves later and your old home is already empty",
                "Review the storage terms you have in writing",
                "Confirm storage or arrange temporary alternatives"
              ],
              [
                "Date moves earlier than planned",
                "Ask whether the mover can accommodate it",
                "Amend the booking by mutual agreement before loading, if interstate"
              ],
              [
                "Loading day is close and the date is unresolved",
                "Re-read the written estimate and services",
                "Decide whether to proceed, adjust or postpone"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "If your booking lead time is a concern, how far in advance to book movers explains the timing trade-offs."
          }
        ]
      },
      {
        "heading": "The date-confidence and change-notification log",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Copy this layout into a notes app or spreadsheet and update it every time you hear something new. Each row is one date that matters."
          },
          {
            "type": "table",
            "caption": "Log template",
            "columns": [
              "Date",
              "Confidence label",
              "Source and day heard",
              "Notification record",
              "Written mover terms?"
            ],
            "rows": [
              [
                "Origin possession or move-out",
                "Target / Likely / Confirmed / Changed",
                "Who said it, and when",
                "Mover, origin contact; record the day and method of notification",
                "Yes / No / Pending"
              ],
              [
                "Pickup",
                "Target / Likely / Confirmed / Changed",
                "Mover confirmation",
                "Origin contact; record the day and method of notification",
                "Yes / No / Pending"
              ],
              [
                "Destination access",
                "Target / Likely / Confirmed / Changed",
                "Who said it, and when",
                "Mover, destination contact; record the day and method of notification",
                "Yes / No / Pending"
              ],
              [
                "Delivery",
                "Target / Likely / Confirmed / Changed",
                "Mover confirmation",
                "Destination contact; record the day and method of notification",
                "Yes / No / Pending"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep the date-confidence log privately. If a company contacts you, explain directly which dates are targets and which have written confirmation, ask how it would handle a change, and record its written answer before relying on a booking."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "For interstate household-goods moves, 49 CFR 375.401 requires a written estimate covering transportation and related services.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "49 CFR 375.401 permits estimate amendments before loading by mutual agreement; the section does not permit amending an estimate after loading.",
                "source": {
                  "label": "49 CFR 375.401: interstate estimates and services",
                  "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "49 CFR 375.401: interstate estimates and services",
        "url": "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-375/subpart-D/section-375.401",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Should I book a mover before my closing date is confirmed?",
        "answer": "It depends on how much flexibility the company offers in writing. If you book with a Target date, get the rescheduling, notice and storage terms confirmed first, and update the log as soon as the date firms up. If the terms are unclear, waiting for a firmer date may be the safer choice, though availability is never guaranteed."
      },
      {
        "question": "Can my moving estimate change if my date changes?",
        "answer": "For interstate household-goods moves, 49 CFR 375.401 allows estimate amendments before loading by mutual agreement and does not permit amending an estimate after loading. Ask the company how a date change would be documented. For local moves, ask for the terms in writing."
      },
      {
        "question": "Who should tell the mover when the closing date moves?",
        "answer": "Pick one person, usually you, to relay changes so the mover receives a single consistent message. Record who was told, when and how. Ask the mover for a written confirmation of any updated date or terms."
      },
      {
        "question": "Does a mover automatically provide storage if my new home isn't ready?",
        "answer": "No. Do not assume storage is available for your dates. Ask each company whether storage is offered, how it is described in writing, and what must be confirmed before you rely on it."
      }
    ],
    "related": [
      "planning:moving-with-a-storage-gap",
      "question:what-is-a-moving-delivery-spread",
      "question:how-far-in-advance-should-i-book-movers"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "moving-day-key-and-access-handoff-checklist",
    "primaryKeyword": "moving day key handoff checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Moving-Day Keys and Access Handoff Checklist",
    "h1": "Moving-day keys and access handoff checklist",
    "metaDescription": "Plan who can open each property on moving day, share access details privately, and keep door or gate codes out of shared worksheets with this access-owner register.",
    "answer": "Name one person who can open each property, record what kind of access is needed, and put the actual key location, door code or gate code only in a private channel. A shared worksheet should hold roles, timing and fallback plans, never secrets. Confirm the plan with your mover before moving day.",
    "sections": [
      {
        "heading": "Start with an access-owner register",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A moving day can stall at a locked door, a gated entrance or a missing key. The simplest prevention is a short register that says who controls access at each property, not what the secret is. The register below is an editorial suggestion, not a regulator form. Build it for the origin and the destination, since the people and timing are usually different."
          },
          {
            "type": "table",
            "caption": "Access roles and timing; keep actual codes separately",
            "columns": [
              "Item",
              "Origin property",
              "Destination property"
            ],
            "rows": [
              [
                "Access owner (name and role)",
                "Who can open it on moving day",
                "Who can open it on moving day"
              ],
              [
                "Access type",
                "Key, lockbox, keypad, fob, building staff",
                "Key, lockbox, keypad, fob, building staff"
              ],
              [
                "Where the secret lives",
                "Private message or phone call only",
                "Private message or phone call only"
              ],
              [
                "Expected available from",
                "Time the owner is on site",
                "Time the owner is on site"
              ],
              [
                "Backup person",
                "Name and role",
                "Name and role"
              ],
              [
                "Fallback if delayed",
                "Agreed waiting plan",
                "Agreed waiting plan"
              ]
            ]
          },
          {
            "type": "note",
            "text": "Never type a real door code, gate code or lockbox combination into this table. If a document might be forwarded, printed or posted, it should say only that the code is shared privately."
          }
        ]
      },
      {
        "heading": "Confirm who can open each property",
        "blocks": [
          {
            "type": "paragraph",
            "text": "For each address, decide who actually has authority to let people in. At your current home that is often you. At the destination it may be a landlord, property manager, real estate agent, building office or a buyer or seller. Do not assume that someone with a key is available at the time the crew will arrive."
          },
          {
            "type": "list",
            "items": [
              "Write down the person who can open the property and a second person who could step in.",
              "Check whether the access method changes by time of day, such as a building office that closes or a gate that needs a visitor entry.",
              "Ask whether any key must be collected first, and from where, before the crew can start.",
              "Confirm that the access owner knows the expected arrival window and where to meet the crew."
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "Do not assume a driver or crew member may enter an unattended property. Unless you have clearly agreed otherwise with the company in writing, plan for a person to be present or reachable who can open the door."
          }
        ]
      },
      {
        "heading": "Check key collection and crew arrival dependencies",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Access problems often come from sequence, not from the lock itself. If the destination key is collected from an agent across town, or a closing is not final until midday, delivery cannot realistically begin until that step is done. Map the chain of dependencies for the day and see where one late step blocks the next."
          },
          {
            "type": "list",
            "items": [
              "Key pickup: who collects it, from whom, and by what time.",
              "Building access: whether staff must unlock a service entrance, loading area or gate.",
              "Crew arrival: the window the company has given you, and whether the access owner can meet that window.",
              "Handover: who returns, leaves or passes along keys at the end of the day."
            ]
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move. Treat that as a useful habit for any move: agree on the arrangements and the contact path before the day, so access questions have a ready answer. If an elevator or loading dock is involved, the elevator reservation handoff checklist covers that piece."
          }
        ]
      },
      {
        "heading": "Use a private channel for access instructions",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Share the register only with the people coordinating access, and send actual codes separately to the person who needs them. A direct phone call, a private message to one named person or a conversation in person is better than a group chat, a shared document or an email thread with many recipients."
          },
          {
            "type": "list",
            "items": [
              "Tell the mover only what they need and only through the contact method you have agreed on.",
              "Confirm with the property owner and company who needs access instructions, then share them privately with that person.",
              "Where possible, use temporary codes or visitor entries and ask the property owner to change or disable them afterward.",
              "Do not post codes in listings, social posts, reviews or public forms."
            ]
          },
          {
            "type": "note",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep the access-owner register privately. If a company contacts you, discuss general access arrangements directly; share an actual door, gate or lockbox code only with the agreed person through a private channel when needed."
          }
        ]
      },
      {
        "heading": "Record the fallback if the receiver is delayed",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Decide before the day what happens if the person receiving the shipment, or the person holding the key, is late. A fallback is a short written plan that names who to call, how long you are willing to wait and what you will do next. Ask the company what its own process is for a delay so your plan matches it, and get any change to the arrangement in writing."
          },
          {
            "type": "paragraph",
            "text": "FMCSA recommends supervising loading and unloading, or asking a known person to act on your behalf when you cannot be there. That is a practical suggestion and does not by itself give anyone legal signing authority. If a helper will be present, tell the company who they are and what you expect them to do, and ask the company whether it needs anything more before that person can sign."
          },
          {
            "type": "list",
            "items": [
              "Name the delay contact and the backup, with phone numbers kept private.",
              "Set a decision point, such as the time you will call the company if access is still unavailable.",
              "Ask the company how a delay could affect timing or services, and note the answer.",
              "Do not have a helper sign anything you have not seen. FMCSA advises reviewing completed shipment documents and not signing blank documents."
            ]
          }
        ]
      },
      {
        "heading": "Run a final check the day before",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The evening before, walk through the register with each access owner and confirm every line is still true. Use this alongside the moving day checklist and, for the receiving end, the [delivery day checklist](/planning/delivery-day-checklist/)."
          },
          {
            "type": "list",
            "items": [
              "Confirm each access owner has your arrival window and can be reached by phone.",
              "Check that keys, fobs and lockbox items are in the right hands and not packed.",
              "Send private codes to the on-site person only.",
              "Review the service scope and contact plan agreed with the company, and compare it with what is written down, since FMCSA recommends comparing the services provided and not only the total.",
              "Keep the register on your phone so you can update it quickly."
            ],
            "ordered": true
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA advises reviewing completed shipment documents and not signing blank documents.",
                "source": {
                  "label": "FMCSA Tips for a Successful Move",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends supervising loading and unloading, or asking a known person to act on the customer behalf when unavailable. This does not establish legal signing authority.",
                "source": {
                  "label": "FMCSA Tips for a Successful Move",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Tips for a Successful Move",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Should I write my door or gate code on the moving worksheet?",
        "answer": "No. Record who holds access and how it will be shared, but give the code itself privately to the person who needs it, by phone or direct message. Worksheets get forwarded, printed and photographed."
      },
      {
        "question": "Can the movers go into my home if I am not there?",
        "answer": "Do not assume so. Unless you have clearly agreed otherwise with the company in writing, plan for someone to be present or reachable who can open the property and answer questions during the move."
      },
      {
        "question": "Can a friend or relative sign moving paperwork for me?",
        "answer": "FMCSA suggests asking a known person to act for you when you cannot be there, but that suggestion does not establish legal signing authority. Ask the company what it requires before moving day, and do not sign blank documents."
      },
      {
        "question": "What if the person with the destination key is late?",
        "answer": "Use your fallback plan: call the backup contact, contact the company through the arrangement you set up, and ask how the delay affects timing or services. Write down any change you agree to."
      }
    ],
    "related": [
      "planning:moving-day-checklist",
      "planning:delivery-day-checklist",
      "planning:moving-elevator-reservation-handoff-checklist"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "moving-deposit-and-cancellation-policy-review-checklist",
    "primaryKeyword": "moving deposit cancellation checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Moving Deposit and Cancellation Policy Review Checklist",
    "h1": "Moving deposit and cancellation-policy review checklist",
    "metaDescription": "Use this worksheet to compare a mover's written deposit, payee, cancellation, refund and date-change terms before you pay, and to save the receipt.",
    "answer": "Before paying any mover, copy the written deposit and cancellation terms into one table: amount, payee, due date, cancellation trigger, refund wording and receipt. FTC guidance warns against demands for cash or a large deposit before a move, but it sets no universal limit. Ask about anything vague before you pay.",
    "sections": [
      {
        "heading": "Confirm the company and the payment recipient first",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A deposit policy only means something if you know who is bound by it. Before you read any fine print, check that the company name on the estimate, the agreement and the payment request all match. Then check who will actually receive your money. A payment request that names a different business, a personal account or an unclear processor is a reason to pause and ask for an explanation in writing."
          },
          {
            "type": "paragraph",
            "text": "Our guides on how to check if a moving company is legitimate and how to spot a moving scam cover identity checks in more depth. Do not judge the request from the presence of a deposit alone. Compare the amount, recipient and written terms, and pause if any of them is unclear or inconsistent."
          },
          {
            "type": "note",
            "text": "The [FTC](https://consumer.ftc.gov/consumer-alerts/2024/09/avoid-scams-when-you-hire-moving-company) provides consumer advice about moving-company estimates and payment demands. The [FMCSA guidance](https://www.fmcsa.dot.gov/protect-your-move/tips-for-success) cited here concerns interstate household-goods moves. This worksheet is an editorial planning aid; it does not determine the law or refund terms for your specific booking."
          }
        ]
      },
      {
        "heading": "The policy table to fill in for each provider",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Make one copy of this table for every provider you are considering. Fill it in only from written documents, not from phone summaries. If a cell stays blank, that blank is your list of questions."
          },
          {
            "type": "table",
            "caption": "Deposit and cancellation worksheet (one per provider)",
            "columns": [
              "Item",
              "What to copy from the document",
              "What to question"
            ],
            "rows": [
              [
                "Amount",
                "The exact deposit or prepayment figure, and whether it is a flat amount or tied to the estimate",
                "A figure that is unexplained, changes between documents, or is described only as a large amount due now"
              ],
              [
                "Payee",
                "The legal business name that receives the payment and the payment method",
                "A name that differs from the company on the estimate, or a request for cash"
              ],
              [
                "Due date",
                "When payment is due: at booking, before loading, or on delivery",
                "A deadline that pressures you to pay before you have a complete written document"
              ],
              [
                "Cancellation trigger",
                "What counts as cancelling, how you must notify the provider, and any cutoff time",
                "Vague wording such as late cancellation with no definition"
              ],
              [
                "Refund language",
                "What is refundable, what is kept, and how and when refunds are issued",
                "No refund wording at all, or terms that say only that deposits are nonrefundable without explanation"
              ],
              [
                "Date-change terms",
                "Whether you can move the date, any fee, and what happens if the provider changes the date",
                "Silence about provider-initiated changes"
              ],
              [
                "Receipt",
                "How the provider will confirm payment in writing, with amount, date and payee",
                "Verbal confirmation only"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Once two or three tables are complete, compare them side by side. The differences are often more revealing than the totals. A lower estimate paired with unclear cancellation wording may carry more risk than a slightly higher one with clear terms."
          }
        ]
      },
      {
        "heading": "Read the written terms against the estimate",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The FTC recommends getting written estimates that describe the property being moved, and comparing them. Apply that to deposits: check that the document describes your actual household, not a generic one, because the deposit and any later charges relate to that scope. If your inventory, stairs, storage needs or dates differ from what is written, ask for a corrected document before you pay. Our guide to [comparing moving estimates](/questions/how-to-compare-moving-estimates/) walks through that comparison."
          },
          {
            "type": "paragraph",
            "text": "FMCSA also advises reviewing completed shipment documents and not signing blank documents. For the deposit stage, that suggests a simple habit: never sign or pay against a form with empty fields for the amount, dates or services. Ask the provider to complete everything first, then read it at your own pace."
          },
          {
            "type": "list",
            "items": [
              "Check that names, addresses, dates and the described property match your plans.",
              "Find every mention of payment, deposit, fee, cancellation and refund, including in attachments or linked terms.",
              "Note any term that points to another document you have not seen, and request that document.",
              "Check whether the deposit is applied to the final bill, and where that is stated.",
              "Mark anything that conflicts with what you were told verbally."
            ],
            "ordered": true
          }
        ]
      },
      {
        "heading": "Ask unresolved questions before payment",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The FTC warns against demands for cash or a large deposit before a move. The cited guidance does not set a universal deposit limit or refund deadline. It cannot by itself establish what applies to your booking. Ask for the complete policy and check any unresolved question before payment."
          },
          {
            "type": "paragraph",
            "text": "Send questions by email when you can, so the answers are saved. Useful questions include:"
          },
          {
            "type": "list",
            "items": [
              "What exactly does the deposit cover, and is it credited toward the final total?",
              "Who is the payee, and does that name match the agreement?",
              "If I cancel, what are the steps, and what happens to the deposit at each stage?",
              "If I need to change my move date, what are the terms?",
              "If you change or cannot honor the date, what happens to my payment?",
              "How will you confirm receipt of my payment in writing?",
              "Is this policy the complete version, and where can I find the most current copy?"
            ]
          },
          {
            "type": "paragraph",
            "text": "Pay attention to how the provider responds. Clear, written answers support a decision. Evasive replies, pressure to pay immediately or refusal to put terms in writing are good reasons to keep comparing."
          }
        ]
      },
      {
        "heading": "Save the policy version and the payment receipt",
        "blocks": [
          {
            "type": "paragraph",
            "text": "After you decide, keep a file with the documents you relied on. Policies and web pages can change, so save the version that applied when you paid."
          },
          {
            "type": "list",
            "items": [
              "The signed or accepted estimate and agreement, as complete copies.",
              "The deposit and cancellation terms as they appeared on the date you paid, such as a PDF or dated screenshot.",
              "Your completed worksheet table and the email thread with answers.",
              "The payment receipt showing amount, date, payee and method.",
              "Any later written changes to dates, scope or price."
            ]
          },
          {
            "type": "paragraph",
            "text": "If another household member makes the payment, keep the payer, booking reference and receipt together in your private file. Ask the provider which booking the payment was credited to, and resolve any mismatch before relying on the receipt."
          }
        ]
      },
      {
        "heading": "Using the worksheet with quote requests",
        "blocks": [
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep the deposit and cancellation worksheet for your own records. If a company contacts you, ask for its written policies directly, compare them using the worksheet, and save the version you accept with any payment receipt."
          },
          {
            "type": "note",
            "text": "Treat every deposit or cancellation term as provider-specific. Only the written document from the company you choose tells you what you would actually be agreeing to."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FTC recommends written estimates describing the property being moved and comparing the estimates.",
                "source": {
                  "label": "FTC: Avoid scams when you hire a moving company",
                  "url": "https://consumer.ftc.gov/consumer-alerts/2024/09/avoid-scams-when-you-hire-moving-company",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FTC warns against demands for cash or a large deposit before a move. Its guidance does not set a universal legal deposit limit or refund deadline.",
                "source": {
                  "label": "FTC: Avoid scams when you hire a moving company",
                  "url": "https://consumer.ftc.gov/consumer-alerts/2024/09/avoid-scams-when-you-hire-moving-company",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA advises reviewing completed shipment documents and not signing blank documents.",
                "source": {
                  "label": "FMCSA Tips for a Successful Move",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FTC: Avoid scams when you hire a moving company",
        "url": "https://consumer.ftc.gov/consumer-alerts/2024/09/avoid-scams-when-you-hire-moving-company",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Tips for a Successful Move",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Is it normal for a mover to ask for a deposit?",
        "answer": "Rather than judging the company from the presence of a deposit alone, examine the payee and written policy. The FTC warns against demands for cash or a large deposit before a move. Ask for an explanation of any payment request that is unclear or inconsistent with the estimate."
      },
      {
        "question": "Is there a legal maximum deposit or a guaranteed refund?",
        "answer": "The cited sources do not set a universal deposit limit or refund deadline. Ask for the policy that applies to your booking and clarify any unresolved refund question before payment; this worksheet does not determine your legal rights."
      },
      {
        "question": "What should I do if the cancellation terms are unclear?",
        "answer": "Ask the provider to clarify in writing before you pay: what counts as cancelling, how to notify them, what is refundable and when. If the answers stay vague, consider that when comparing providers."
      },
      {
        "question": "Should I pay before I have a written estimate?",
        "answer": "The FTC recommends written estimates that describe the property being moved, and comparing them. As an editorial suggestion, wait for a complete written document before paying, and do not sign anything with blank fields."
      }
    ],
    "related": [
      "question:how-to-spot-a-moving-scam",
      "question:how-to-check-if-a-moving-company-is-legitimate",
      "question:how-to-compare-moving-estimates"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "moving-truck-parking-permit-preparation-checklist",
    "primaryKeyword": "moving truck parking permit checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Moving-truck parking and permit preparation checklist",
    "h1": "Moving-truck parking and permit preparation checklist",
    "metaDescription": "Build a parking-permission register: record the vehicle, check local authority and building rules, name the applicant, and confirm the plan with your mover.",
    "answer": "Before moving day, record the exact truck or container and both curb addresses, then ask the local authority and building manager what applies at each address. Assign who applies, who handles any sign posting, and who is responsible for the vehicle, and ask the provider to acknowledge the written parking plan. Boston shows why address-specific rules matter, but it is not a nationwide rule.",
    "sections": [
      {
        "heading": "Record the actual truck or container and both curb addresses",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A parking question is only answerable once the vehicle and the location are specific. \"A moving truck\" is too vague for a city office or a property manager. Before you contact anyone, write down what will actually arrive and where it will stop. Do this for both the origin and the destination, because the two addresses may fall under different authorities and different building rules."
          },
          {
            "type": "list",
            "items": [
              "Whether the provider is sending a truck with a crew, or delivering a container or trailer that will sit at the curb or in a driveway. These are different situations, so do not reuse a truck answer for a container.",
              "The approximate vehicle length and any height concern the provider gives you in writing. Ask the provider; do not guess.",
              "The exact street address and which side of the street or which entrance you hope to use.",
              "Whether the load will need a shuttle or a long carry from a legal stopping point. If so, review the shuttle access assessment checklist.",
              "The date and the time window you are asking for, including loading and unloading time."
            ],
            "ordered": false
          },
          {
            "type": "note",
            "text": "Treat any vehicle details as provider-supplied information to be confirmed. This checklist does not set a size, a time limit or a distance for any location."
          }
        ]
      },
      {
        "heading": "Ask each local authority and building manager which permissions apply",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Street rules and property rules are separate layers. The street may be governed by a city, town or county office. The building, campus or community may add its own rules about elevators, loading docks, driveways or fire lanes. A yes from one does not answer the other, so ask both and write down who said what."
          },
          {
            "type": "paragraph",
            "text": "Boston is a useful example of why this matters. The city publishes its own process for reserving moving-truck parking, described by the [Boston Parking Clerk](https://www.boston.gov/departments/parking-clerk/reserve-parking-spot-your-moving-truck). That is a Boston process, not a nationwide rule. It does not tell you what your own city requires, and it does not mean every city has a reservation process. Your address may have a different office, a different form or no formal process at all. Only the local source can tell you."
          },
          {
            "type": "list",
            "items": [
              "Which office handles curb use or temporary parking restrictions at this exact address? Search the official city or county site, or call its general line and ask.",
              "Does a truck or container at this curb need any permission, reservation or notice? If so, what is the current process? Ask for the official page or form rather than relying on a summary.",
              "Does the answer differ for a truck versus a container, trailer or portable storage unit?",
              "Does the building manager, HOA or property office require approval, a reservation, an elevator booking or proof of insurance from the mover? Ask for it in writing.",
              "Are there existing restrictions at the curb, such as a bus stop, hydrant, driveway or posted street-cleaning time, that affect where the vehicle can stand?"
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "For apartment moves, pair this step with the moving from an apartment checklist, which covers building-side coordination more broadly."
          }
        ]
      },
      {
        "heading": "Separate the applicant, sign posting and mover responsibilities",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Parking problems often come from an assumption that someone else handled it. You may assume the mover applies, while the mover assumes the customer holds the property permission. Settle this before moving day and put it in writing. The table below is an editorial suggestion for dividing tasks, not a legal assignment of duties. Use the authority instructions and your agreed written scope to assign each task; ask for clarification if they do not line up."
          },
          {
            "type": "table",
            "caption": "Responsibility split to settle in writing",
            "columns": [
              "Task",
              "Question to ask",
              "Who will do it (fill in)"
            ],
            "rows": [
              [
                "Apply for or request any street permission",
                "Does the authority accept applications from the customer, the provider or either?",
                "Record the named applicant"
              ],
              [
                "Obtain building or property approval",
                "Who contacts the manager, and what documents are needed?",
                "Record the property contact"
              ],
              [
                "Post or place any required signs or notices",
                "Does the authority specify who does this and by when? Who will be on site to do it?",
                "Record the person posting signs"
              ],
              [
                "Hold the confirmation",
                "Who keeps the approval number, email or printout and brings it on moving day?",
                "Record the confirmation holder"
              ],
              [
                "Handle problems at the curb",
                "Who decides what to do if the space is blocked or the vehicle cannot stand where planned?",
                "Record the day-of decision contact"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "If an authority names the applicant or the party responsible for signs, use its wording. If it does not say, record that the answer was unclear and ask the provider how they usually handle it, then get the answer in writing."
          }
        ]
      },
      {
        "heading": "Keep a parking-permission register",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A simple register keeps the origin and destination answers from blurring together. Make one row per address. Copy the columns into a note or spreadsheet and fill them in as you hear back. The columns are an editorial suggestion, not a form any agency requires."
          },
          {
            "type": "table",
            "caption": "Parking-permission register (one row per address)",
            "columns": [
              "Field",
              "Origin address",
              "Destination address"
            ],
            "rows": [
              [
                "Curb address and side of street",
                "Origin: enter the exact curb location",
                "Destination: enter the exact curb location"
              ],
              [
                "Vehicle: truck, container or trailer, with provider-stated length",
                "Origin: ask the provider for the vehicle details",
                "Destination: ask the provider for the vehicle details"
              ],
              [
                "Authority or office contacted, and the official page used",
                "Origin: record the office and official source",
                "Destination: record the office and official source"
              ],
              [
                "Building or property contact and their answer",
                "Origin: record the property answer and contact",
                "Destination: record the property answer and contact"
              ],
              [
                "Permission needed? (yes / no / unclear, with source)",
                "Origin: record yes, no or unclear and the source",
                "Destination: record yes, no or unclear and the source"
              ],
              [
                "Applicant",
                "Origin: record the agreed applicant",
                "Destination: record the agreed applicant"
              ],
              [
                "Date and time window requested",
                "Origin: record the requested window",
                "Destination: record the requested window"
              ],
              [
                "Sign posting: who and when",
                "Origin: record the sign-posting owner and timing",
                "Destination: record the sign-posting owner and timing"
              ],
              [
                "Confirmation number, email or document",
                "Origin: record where the confirmation is kept",
                "Destination: record where the confirmation is kept"
              ],
              [
                "Provider acknowledged the plan? (date)",
                "Origin: record the acknowledgment date",
                "Destination: record the acknowledgment date"
              ]
            ]
          },
          {
            "type": "note",
            "text": "Mark \"unclear\" honestly. An unclear row is a reason to ask another question, not a cue to assume the answer is no."
          }
        ]
      },
      {
        "heading": "Confirm the provider has acknowledged the written parking plan",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Once the register is filled in, send a short written summary to the provider: the vehicle, the curb address, the date and window, who applies, who posts signs, and where the confirmation is kept. Ask them to reply and say they have read it and whether anything differs from their plan. A reply on file is more useful than a verbal okay."
          },
          {
            "type": "paragraph",
            "text": "Two FMCSA planning recommendations support this approach. FMCSA recommends [comparing the services provided, not only the quoted total](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist), so when you compare providers, ask what each one's written scope says about parking, carries and who handles access. FMCSA also recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move. Apply that to parking: agree on a contact name and number to use if the curb is blocked or the plan has to change on the day."
          },
          {
            "type": "list",
            "items": [
              "Send the written parking plan and ask for a written reply.",
              "Ask whether the provider's written scope mentions parking, carries, stairs or shuttle service. For related cost questions, see do movers charge for stairs and long carries.",
              "Save the contact details you will use before, during and after the move.",
              "Re-check the register a few days before the move and update any row that changed.",
              "Bring the confirmation and the register on moving day, on paper or on your phone."
            ],
            "ordered": true
          }
        ]
      },
      {
        "heading": "Keep the parking register for provider conversations",
        "blocks": [
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep your parking-permission register privately. If a company contacts you, discuss the expected vehicle or container, confirmed access information and open authority questions directly, then ask it to acknowledge the agreed parking plan in writing."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "Boston publishes its own process for reserving moving-truck parking. This is a Boston example, not a nationwide rule.",
                "source": {
                  "label": "Boston Parking Clerk: reserve a moving-truck parking spot",
                  "url": "https://www.boston.gov/departments/parking-clerk/reserve-parking-spot-your-moving-truck",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "Boston Parking Clerk: reserve a moving-truck parking spot",
        "url": "https://www.boston.gov/departments/parking-clerk/reserve-parking-spot-your-moving-truck",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Does every city require a permit for a moving truck?",
        "answer": "Do not assume so, and do not assume the reverse. Rules differ by location. Boston publishes its own process for reserving moving-truck parking, but that is one city's example. Check the official source for your specific address."
      },
      {
        "question": "Is a moving container handled the same way as a truck?",
        "answer": "Not necessarily. A container or trailer may sit at the curb or in a driveway for longer than a truck, so the street and property questions may differ. Record which one you are using and ask the authority and building manager about that specific vehicle."
      },
      {
        "question": "Who should apply for parking permission, me or the mover?",
        "answer": "It depends on the local process and your written agreement. Ask the authority who may apply, then ask the provider who will do it. Record the answer in the register so no one assumes the other has handled it."
      },
      {
        "question": "What if the building manager approves but I cannot find a city rule?",
        "answer": "Mark the street row as unclear and keep asking. Contact the city or county office that handles curb use, and ask for an answer in writing if possible. Building approval covers the property side only."
      }
    ],
    "related": [
      "planning:moving-from-an-apartment-checklist",
      "planning:moving-shuttle-access-assessment-checklist",
      "question:do-movers-charge-for-stairs-and-long-carries"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "remote-moving-representative-handoff-checklist",
    "primaryKeyword": "manage move remotely checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Remote Moving Representative Handoff Checklist",
    "h1": "Remote moving representative handoff checklist",
    "metaDescription": "Decide which tasks a local representative may handle on moving day and which decisions must return to you, with a responsibility, contact and escalation sheet.",
    "answer": "If you cannot be present for a move, name a known person as your representative and get the carrier's acceptance in writing. Then give that person a written sheet listing the tasks they may handle, the decisions that come back to you, and who to contact if something goes wrong. FMCSA's advice on this covers interstate household-goods moves and does not establish signing authority.",
    "sections": [
      {
        "heading": "Ask the carrier what authorization it accepts",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Start with the company handling the move, not with your representative. FMCSA recommends supervising loading and unloading, or asking a known person to act on your behalf when you are unavailable. That advice comes from its guidance for interstate household-goods moves. It does not establish that your representative has legal authority to sign anything for you."
          },
          {
            "type": "paragraph",
            "text": "Because of that gap, ask the company directly what it will accept. Request the answer in writing, by email or in a written service document, so the person on site is not relying on a verbal promise."
          },
          {
            "type": "list",
            "items": [
              "Will the company accept a named representative at pickup, delivery or both?",
              "What does it need from you beforehand, such as the person's name, phone number or a written note?",
              "Which actions may that person take on site, and which must you handle yourself?",
              "Will the driver or crew lead verify the person's identity, and how?",
              "How will you receive copies of anything the representative sees or is given?"
            ],
            "ordered": true
          },
          {
            "type": "note",
            "text": "Do not assume a text message or a verbal okay gives your representative permission to sign, accept changes or release your goods. Use the carrier's answer to plan the handoff, while keeping actual legal authority separate. If signing authority is unresolved, seek appropriate advice before assigning that task."
          }
        ]
      },
      {
        "heading": "Provide a task and inventory handoff",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A representative who has never seen your home needs more than an address. Give them a short sheet that separates what they may do from what they should only observe or report. The sheet below is an editorial suggestion, not a regulator form. Adjust it to what the company confirms."
          },
          {
            "type": "table",
            "caption": "Sample responsibility, contact and escalation sheet",
            "columns": [
              "Item",
              "Representative may",
              "Return to customer",
              "Escalate to"
            ],
            "rows": [
              [
                "Access and parking",
                "Unlock doors, point out reserved parking, show restricted areas",
                "Any change to the address or access plan",
                "Customer, then the company contact"
              ],
              [
                "Room walk-through",
                "Point out items to load or leave, using your written room notes",
                "Adding or removing items that change the scope of work",
                "Customer by phone before the crew proceeds"
              ],
              [
                "Fragile or high-value items",
                "Show the crew where they are and note how they are handled",
                "Decisions about valuation or special handling",
                "Customer and company contact"
              ],
              [
                "Inventory and condition",
                "Watch the count, take photos, note visible damage",
                "Agreeing to disputed notes or conditions",
                "Customer before anything is accepted"
              ],
              [
                "Paperwork",
                "Receive copies and send photos of them to you",
                "Signing, or any document with blanks",
                "Customer and company contact"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Pair the sheet with your inventory and room notes. For a deeper process on recording condition before items leave, see the pickup condition photo inventory checklist."
          }
        ]
      },
      {
        "heading": "Keep customer approval routes available",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Even with a trusted representative, some decisions should come back to you. FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move. Apply that to your own availability too: decide in advance how the crew and your representative can reach you, and who can reach the company."
          },
          {
            "type": "list",
            "items": [
              "Share your best phone number and a backup, such as an email address you check during the move.",
              "Tell your representative which hours you will be reachable and which time zone you are in.",
              "Ask the company and representative to agree how a change in scope, timing or paperwork will be paused and escalated to you.",
              "Ask the company for a dispatcher or office contact, plus the driver or crew lead contact when available.",
              "Have your representative write down the time and content of any call about a change."
            ]
          },
          {
            "type": "paragraph",
            "text": "If you cannot be reached, the safest default on the sheet is to do nothing irreversible. Your representative can document the situation and wait, rather than guess at what you would have approved."
          }
        ]
      },
      {
        "heading": "Arrange document and condition-photo delivery",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA advises reviewing completed shipment documents and not signing blank documents. That advice applies to interstate household-goods shipments. When you are away, build a routine so you can still review paperwork before anyone acts on it."
          },
          {
            "type": "list",
            "items": [
              "Ask your representative to photograph each page of any document before and after it is completed.",
              "Have them send the photos to you right away, rather than at the end of the day.",
              "Tell them not to sign blank documents. Confirm both the company handoff process and any actual signing authority before assigning a signature task; company acceptance alone does not establish that authority.",
              "Ask for copies of the final documents and note who will send them to you.",
              "Keep condition photos organized by room, with a time stamp or a short note about the item."
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "At delivery, repeat the same routine. The [delivery day checklist](/planning/delivery-day-checklist/) can help you decide what to compare against your pickup records, and the moving day checklist covers the in-person tasks your representative will be standing in for."
          }
        ]
      },
      {
        "heading": "Compare the service scope before you commit",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total. For a remote move, that comparison should include how each company handles an absent customer. Ask each one to describe, in writing, what it accepts from a representative, how it will contact you and how it will share documents."
          },
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep your representative handoff sheet privately. If a company contacts you, explain directly which pickup or delivery you cannot attend and ask it to confirm its representative process before you commit."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends supervising loading and unloading, or asking a known person to act on the customer behalf when unavailable. This does not establish legal signing authority.",
                "source": {
                  "label": "FMCSA Tips for a Successful Move",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA advises reviewing completed shipment documents and not signing blank documents.",
                "source": {
                  "label": "FMCSA Tips for a Successful Move",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Tips for a Successful Move",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Can my representative sign the moving paperwork for me?",
        "answer": "Do not assume so. FMCSA's recommendation to ask a known person to act for you does not establish legal signing authority. Ask what the company requires for the handoff and resolve the person's actual authority separately before assigning any signature task."
      },
      {
        "question": "What should I give my representative before moving day?",
        "answer": "Give them a one-page sheet with their allowed tasks, decisions that return to you, your contact details, the company's contact details and your room and fragile-item notes. Send a copy to the company too if it will accept one."
      },
      {
        "question": "What if I cannot be reached during a decision?",
        "answer": "The sheet should say the representative documents the issue and avoids irreversible steps until you respond. Do this in advance so nobody has to improvise under time pressure."
      },
      {
        "question": "Does this apply to local or labor-only moves?",
        "answer": "The FMCSA guidance used here concerns interstate household-goods transport. For local or labor-only work, treat the checklist as a practical suggestion and confirm the terms with the company."
      }
    ],
    "related": [
      "planning:moving-day-checklist",
      "planning:pickup-condition-photo-inventory-checklist",
      "planning:delivery-day-checklist"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "shared-home-partial-shipment-checklist",
    "primaryKeyword": "moving out shared house checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Moving Out of a Shared Home: Partial Shipment Checklist",
    "h1": "Moving part of a shared home: shipment checklist",
    "metaDescription": "Build an agreed move, stay and unresolved item register so a partial shipment from a shared home includes only the belongings meant to go.",
    "answer": "When only some belongings leave a shared home, build a three-column register before requesting estimates: move, stay and unresolved. Agree on it with the other household members, label items by destination, and give the crew only the move list. Leave disputed or unclear items out of the loading instruction until they are settled.",
    "sections": [
      {
        "heading": "Resolve the intended shipment before requesting estimates",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A partial move from a home where other people still live is easy to misdescribe. If the shipment is not settled, every estimate rests on a guess, and the guess can change on moving day. Before you describe the job to anyone, decide which rooms are involved, which items are going and where they are going."
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, FMCSA recommends getting several estimates and comparing the services provided, not just the quoted total. That comparison only works if each company is asked about the same shipment. A settled register gives you one description to reuse, so differences between estimates come from the services offered and not from changes to your item list."
          },
          {
            "type": "list",
            "items": [
              "List the rooms and storage areas the shipment will draw from, such as a bedroom, part of a garage or a shared closet.",
              "Name everyone in the household who has a stake in what leaves, and ask each person to review the list.",
              "Write down the pickup address, the delivery address and any access limits at either end.",
              "Note any services you expect, such as packing help, disassembly or a storage stop, so you can compare like with like."
            ],
            "ordered": true
          },
          {
            "type": "note",
            "text": "This page is practical planning guidance, not advice on ownership, tenancy, separation or inheritance. If people disagree about who owns or may take an item, pause that item and get appropriate help before it goes on any moving list."
          }
        ]
      },
      {
        "heading": "Build the move, stay and unresolved register",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The register is a simple table that you and the other household members can read in a few minutes. It has three decision columns. Each room or area gets a row, and each item that goes gets a destination label in the Move column. This is an editorial worksheet, not a form that any regulator requires."
          },
          {
            "type": "table",
            "caption": "Sample register layout (edit rows to match your home)",
            "columns": [
              "Room or area",
              "Move (with destination label)",
              "Stay",
              "Unresolved"
            ],
            "rows": [
              [
                "Bedroom",
                "Bed frame, dresser, boxes A1 through A6 (label: NEW HOME - BEDROOM)",
                "Guest bed, curtains",
                "Desk chair"
              ],
              [
                "Kitchen",
                "Two boxes of cookware, small appliance (label: NEW HOME - KITCHEN)",
                "Shared dishes, large appliances",
                "Stand mixer"
              ],
              [
                "Living room",
                "Bookshelf, two boxes of books (label: NEW HOME - LIVING)",
                "Sofa, TV, shared rugs",
                "Framed art"
              ],
              [
                "Garage or storage",
                "Bikes, tool box (label: STORAGE UNIT)",
                "Shared tools, seasonal decor",
                "Boxes with mixed contents"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Use the same destination labels on the register and on the items themselves. If the shipment goes to more than one place, such as a new home and a storage unit, give each place its own label so the crew can tell where each item is headed."
          }
        ]
      },
      {
        "heading": "Make room-level decisions and label items",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Work one room at a time. Walking through a space with the other household members prevents the vague decisions that cause loading mistakes, like \"take the stuff in the corner.\" Say each item's status out loud and write it down."
          },
          {
            "type": "list",
            "items": [
              "Mark Move items with a removable label that shows the destination. Put it where a loader will see it without opening anything.",
              "Mark Stay items with a different, clearly visible label, or group them in a part of the room the crew will not enter.",
              "Keep shared items in Stay unless everyone has agreed in writing, even if informally in a message thread, that they are going.",
              "Pack and label boxes by room and destination, and avoid mixing Move items with Stay items in one container.",
              "Photograph each room after labeling. Photos help the household confirm what was agreed, and the pickup condition and photo inventory checklist explains how to document items."
            ]
          },
          {
            "type": "paragraph",
            "text": "If you are also reducing volume, the downsizing guide covers sorting items you no longer want. Keep that separate from this register. Downsizing is about what you no longer want, while a partial shipment is about what leaves a home that others still occupy."
          }
        ]
      },
      {
        "heading": "Keep unresolved property out of the loading instruction",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Unresolved items are the main risk in a shared home, because an item that nobody has decided on can easily get loaded by default. Treat unresolved as a holding status, not a quiet yes."
          },
          {
            "type": "list",
            "items": [
              "Do not include unresolved items in the shipment description you give to companies.",
              "Agree with the household how to mark unresolved items so the crew can identify them without changing possession or deciding a dispute.",
              "Mark them with a clear label such as DO NOT LOAD so a crew member unfamiliar with the household does not guess.",
              "Review the Unresolved column once more the day before pickup. Anything still undecided stays behind.",
              "If the disagreement is about who may take an item, stop deciding it among yourselves under time pressure and seek appropriate help."
            ]
          },
          {
            "type": "paragraph",
            "text": "Keep unresolved items excluded from this loading instruction. Make any later transport plan only after the disagreement is resolved through the appropriate process; the moving crew should not be asked to decide it."
          }
        ]
      },
      {
        "heading": "Give the crew one agreed, authorized inventory",
        "blocks": [
          {
            "type": "paragraph",
            "text": "On moving day the crew should work from one list that the household has agreed to, not from several people's spoken instructions. Print or share the Move column with its destination labels, and name one person to answer questions and approve changes."
          },
          {
            "type": "paragraph",
            "text": "For interstate household-goods moves, FMCSA recommends supervising loading and unloading, or asking a known person to act on your behalf if you cannot be there. FMCSA's guidance does not establish legal signing authority, so do not assume a helper may sign for you. Confirm with the company what it needs if someone else will be present."
          },
          {
            "type": "paragraph",
            "text": "FMCSA also recommends establishing pickup and delivery arrangements and how to reach the provider before, during and after the move. Write down the on-site contact on each side, including who will be at the shared home while loading happens."
          },
          {
            "type": "paragraph",
            "text": "Read every shipment document once it is complete, and compare it with your Move list. FMCSA advises reviewing completed shipment documents and not signing blank documents. If a form lists something you did not agree to move, or omits items you did, raise it before signing. These points come from FMCSA's guidance for interstate household-goods moves. Local or labor-only arrangements may work differently, so ask the company what applies to your job. More detail is in the FMCSA [moving checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist) and [tips for a successful move](https://www.fmcsa.dot.gov/protect-your-move/tips-for-success)."
          }
        ]
      },
      {
        "heading": "Prepare the agreed shipment for provider conversations",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Once the register is agreed, you have a clear description for direct provider conversations. If a company contacts you, explain which rooms and items would move and which would remain in the occupied home. Our guide on [how to compare moving estimates](/questions/how-to-compare-moving-estimates/) shows how to line up the services each company describes."
          },
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep the move, stay and unresolved register privately. If a company contacts you, discuss only the agreed shipment directly and prepare a clear loading list; keep private details of household disagreements out of that discussion."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA advises reviewing completed shipment documents and not signing blank documents.",
                "source": {
                  "label": "FMCSA Tips for a Successful Move",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends supervising loading and unloading, or asking a known person to act on the customer behalf when unavailable. This does not establish legal signing authority.",
                "source": {
                  "label": "FMCSA Tips for a Successful Move",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "FMCSA Tips for a Successful Move",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/tips-for-success",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "What should I tell a provider about unresolved items?",
        "answer": "In a direct estimate conversation, describe only the items on the agreed Move list. Keep unresolved items excluded from the loading instruction. If an item is settled later, discuss the updated scope directly with the company before the work is finalized."
      },
      {
        "question": "Do all household members have to sign off on the register?",
        "answer": "This is an editorial recommendation, not a legal requirement. Getting each person to review the list, even by message, reduces the chance that someone's belongings are loaded by mistake. If people cannot agree, stop and seek appropriate help instead of forcing a decision."
      },
      {
        "question": "Can someone else supervise loading for me?",
        "answer": "For interstate household-goods moves, FMCSA recommends supervising loading and unloading or asking a known person to act on your behalf when you cannot be there. That guidance does not establish legal signing authority, so check with the company what it requires."
      },
      {
        "question": "What if a shipping document lists items I am not moving?",
        "answer": "Do not sign it as written. FMCSA advises reviewing completed shipment documents and not signing blank documents. Compare the document with your Move list and ask for corrections before you sign."
      }
    ],
    "related": [
      "planning:downsizing-before-a-move",
      "planning:pickup-condition-photo-inventory-checklist",
      "question:how-to-compare-moving-estimates"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "senior-living-household-move-handoff-checklist",
    "primaryKeyword": "senior living moving checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Moving Into Senior Living: Household Handoff Checklist",
    "h1": "Moving into senior living: household handoff checklist",
    "metaDescription": "Coordinate the accepted item list, receiving room, delivery appointment and decision contact with the actual senior living community before a small household move.",
    "answer": "Start with the actual community, not a generic rule. Ask who coordinates move-ins, what belongings may come, and what written access instructions apply. Then build one handoff form covering the item list, receiving room, delivery appointment, helpers and a single decision contact, and compare mover tasks separately from family or community tasks.",
    "sections": [
      {
        "heading": "Start with the actual community's move-in contact",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Plan the handoffs around the resident, the actual receiving community and the people helping with this move. The resident, family members, community staff and a mover may each hold part of the plan. Before anyone books a delivery, find out who at the specific community handles move-ins and ask for their access instructions in writing."
          },
          {
            "type": "paragraph",
            "text": "Brookdale's published move-in guidance advises coordinating with the specific community and checking what the new home includes and what belongings may be brought. That is one company's guidance, not a description of every senior living community. Treat it as a reason to ask your own community directly, not as a rule that applies to yours."
          },
          {
            "type": "list",
            "items": [
              "Ask who is the move-in contact and how to reach them before, during and after delivery.",
              "Ask what the apartment or room includes, so you do not move items that are already provided.",
              "Ask which belongings are accepted and whether any categories need approval.",
              "Ask for access instructions in writing, including any limits on timing, entrances or parking for a moving vehicle.",
              "Write down the answer, the person's name and the date you received it."
            ],
            "ordered": true
          },
          {
            "type": "note",
            "text": "Facility rules, care arrangements and medical needs are for the community and the resident's own advisers to answer. This guide only helps you organize the questions and the household logistics."
          }
        ]
      },
      {
        "heading": "List only the belongings going to the new apartment",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A clean item list is the heart of the handoff. It gives the mover a specific scope to assess, helps the community review the intended belongings and lets helpers know where things belong. If you are still deciding what to keep, work through downsizing before a move first, then return here with a final list."
          },
          {
            "type": "list",
            "items": [
              "Build the list from the community's accepted-items answer, not from what fits in the old home.",
              "Group items by destination: bedroom, living area, bathroom, kitchenette, closet.",
              "Mark anything that needs the community's approval before it travels.",
              "Keep a separate list for items going to family, storage, donation or sale so they are not loaded by mistake.",
              "Note fragile, high-value or sentimental pieces that the resident wants handled personally."
            ]
          },
          {
            "type": "paragraph",
            "text": "Share the final list with the community contact and with any mover you are considering. If the list changes, send the update to both, so the accepted version is always the current version."
          }
        ]
      },
      {
        "heading": "The facility-acceptance and receiving-room handoff form",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The form below is an editorial suggestion, not a requirement from any regulator or community. Fill it in with the actual community and keep a copy where every helper can find it. Adapt the rows to what your community tells you."
          },
          {
            "type": "table",
            "caption": "Sample handoff form (editorial suggestion)",
            "columns": [
              "Item to confirm",
              "What to record",
              "Who confirms"
            ],
            "rows": [
              [
                "Move-in contact",
                "Name, phone, email, hours reachable",
                "Community staff"
              ],
              [
                "Written access instructions",
                "Date received, entrance, parking, any timing limits",
                "Community staff"
              ],
              [
                "Accepted belongings",
                "Final list, items needing approval",
                "Community and resident"
              ],
              [
                "Receiving room",
                "Room or apartment number, what is already provided",
                "Community staff"
              ],
              [
                "Delivery appointment",
                "Date and time window as confirmed in writing",
                "Community and mover"
              ],
              [
                "Decision contact",
                "One named person who can approve changes on the day",
                "Resident or their chosen, appropriately authorized helper"
              ],
              [
                "Keys and entry",
                "Who holds keys, who meets the truck, who signs in",
                "Confirm with resident and community"
              ],
              [
                "First-day essentials",
                "Who packs, carries and unpacks them",
                "Named helper"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Do not treat a blank row as acceptable. If you cannot get an answer, write down who you asked and when, then follow up."
          }
        ]
      },
      {
        "heading": "Assign keys, receiving and first-day essentials to named helpers",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Before delivery day, turn each agreed responsibility into a named task. Give each task one name, not a group, and make sure each person has the handoff form and the contact numbers."
          },
          {
            "type": "list",
            "items": [
              "Receiving helper: meets the delivery at the new apartment, points to rooms and checks items against the list.",
              "Key holder: has access to the old home and the new apartment, and knows when to hand keys over.",
              "Decision contact: the one person who answers mover or community questions and approves changes.",
              "Resident companion: stays with the resident, keeps them comfortable and notes which items they want close at hand.",
              "First-day essentials helper: carries a separate bag or box, so those items never travel on the truck."
            ]
          },
          {
            "type": "paragraph",
            "text": "For the essentials, see the first night box checklist and adapt it to the resident's routines, such as medications, glasses, chargers, favorite bedding and a few familiar items. Keep anything the resident needs daily with a person, not in the moving vehicle."
          }
        ]
      },
      {
        "heading": "Compare mover work separately from community and family tasks",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total. In a senior living move, that comparison is easier when you first sort tasks into three columns: what a mover would do, what community staff may or may not do, and what family or friends will cover."
          },
          {
            "type": "table",
            "caption": "Sorting tasks before you compare estimates",
            "columns": [
              "Task",
              "Mover",
              "Community staff",
              "Family or friends"
            ],
            "rows": [
              [
                "Packing the old home",
                "Ask whether included",
                "Do not assume",
                "Ask who covers"
              ],
              [
                "Loading and transport",
                "Ask whether included",
                "Do not assume",
                "Ask who covers"
              ],
              [
                "Carrying items into the room",
                "Ask whether included",
                "Confirm with community",
                "Ask who covers"
              ],
              [
                "Furniture placement",
                "Ask whether included",
                "Confirm with community",
                "Ask who covers"
              ],
              [
                "Unpacking and setup",
                "Ask whether included",
                "Confirm with community",
                "Ask who covers"
              ],
              [
                "Packing material removal",
                "Ask whether included",
                "Confirm with community",
                "Ask who covers"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Do not assume that community staff will help with moving tasks such as hanging items or assembling furniture. Ask, and get the answer in writing. During direct estimate conversations, give each company the same item list, addresses and access instructions so the written scopes can be compared fairly."
          }
        ]
      },
      {
        "heading": "Confirm the delivery appointment and day-of contacts",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move. For a senior living delivery, add the community contact to that same list so everyone knows who to call if timing shifts."
          },
          {
            "type": "list",
            "items": [
              "Confirm the delivery window with the community before you finalize it with any mover.",
              "Give the mover the community's written access instructions and the receiving room.",
              "Exchange phone numbers for the decision contact, the receiving helper and the mover's day-of contact.",
              "Ask how delays, changes to the item list or access problems will be communicated.",
              "Review the [delivery day checklist](/planning/delivery-day-checklist/) the day before and update it with the community's details."
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep the resident/community handoff worksheet privately. If a company contacts you, discuss the agreed belongings, receiving room and community access instructions directly, and ask which tasks it would perform separately from community staff or helpers."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "Brookdale advises coordinating move-in with the specific community and checking what the new home includes and what belongings may be brought. This describes Brookdale guidance, not every senior-living community.",
                "source": {
                  "label": "Brookdale: what to expect on moving day",
                  "url": "https://www.brookdale.com/en/where-to-begin/making-the-move/what-to-expect-on-moving-day.html",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "Brookdale: what to expect on moving day",
        "url": "https://www.brookdale.com/en/where-to-begin/making-the-move/what-to-expect-on-moving-day.html",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Who should I ask first about moving into a senior living community?",
        "answer": "Ask the specific community for its move-in contact. Policies differ between communities, so request access instructions, accepted belongings and what the room includes directly from them, and keep the answers in writing."
      },
      {
        "question": "Can I use Brookdale's guidance for any community?",
        "answer": "No. Brookdale's guidance advises coordinating with the specific community and checking what belongings may be brought, but it describes Brookdale, not every community. Use it as a prompt for questions, then confirm your own community's rules."
      },
      {
        "question": "What should be on the household handoff form?",
        "answer": "Include the move-in contact, written access instructions, accepted item list, receiving room, delivery appointment, decision contact, key holder and first-day essentials helper. The form is an editorial suggestion; adjust it to what your community tells you."
      },
      {
        "question": "How do I compare mover estimates for a small senior living move?",
        "answer": "Give each company the same item list, addresses and access instructions, then compare the services in writing, not only the total. FMCSA recommends comparing the services provided across several estimates."
      }
    ],
    "related": [
      "planning:downsizing-before-a-move",
      "planning:first-night-box-checklist",
      "planning:delivery-day-checklist"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "college-dorm-small-move-checklist",
    "primaryKeyword": "college student movers checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "College and Dorm Moving Checklist: Inventory and Access",
    "h1": "College or dorm small-move checklist",
    "metaDescription": "Confirm your campus's actual housing rules, inventory your room and define a small-shipment scope before you ask for written moving quotes.",
    "answer": "Start with your own housing assignment, official move dates and the housing office's current receiving instructions. Then inventory only what is yours, note access details for both addresses, and write down who handles checkout, pickup and delivery. A clear, small-shipment scope makes written estimates easier to compare and avoids assuming campus rules from another school.",
    "sections": [
      {
        "heading": "Get the actual housing assignment, dates and receiving instructions",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Start by asking your housing office which instructions apply to your specific assignment, then gather the relevant paperwork. Look for your housing assignment, your contract dates, any move-out or checkout window, and written instructions from the housing office about deliveries, storage and access."
          },
          {
            "type": "paragraph",
            "text": "Dates can differ even within one school. UCLA Housing says undergraduate contract dates and move-in and move-out periods vary by assigned housing location. That is a UCLA example, not a rule for other schools. Treat it as a reminder to check the specific building or hall on your assignment rather than relying on a general campus calendar or a friend's experience."
          },
          {
            "type": "paragraph",
            "text": "Ask the housing office, or your destination landlord or program, for current instructions. Do not assume that rules about loading areas, elevator use, outside vendors, package receiving or checkout steps at one school apply to yours."
          },
          {
            "type": "note",
            "text": "If you are not sure whether you are affiliated with a campus program, housing contract or sublease, confirm that first. Build the plan around the documents you actually hold."
          }
        ]
      },
      {
        "heading": "Use a campus-policy, room-inventory and move-window worksheet",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The worksheet below is an editorial suggestion, not a requirement from any school or regulator. Prepare it for direct estimate conversations so you can give the same details to each company."
          },
          {
            "type": "table",
            "caption": "Suggested worksheet",
            "columns": [
              "Item to record",
              "What to write down",
              "Where to confirm"
            ],
            "rows": [
              [
                "Housing assignment",
                "Building, room and any listed access notes",
                "Housing assignment email or portal"
              ],
              [
                "Move window",
                "Earliest and latest allowed dates and times for your building",
                "Housing office, in writing"
              ],
              [
                "Receiving rules",
                "Whether items may be delivered or held, and who may sign",
                "Housing or mail services office"
              ],
              [
                "Outside provider rules",
                "Any stated limits on vehicles, parking, elevators or insurance paperwork",
                "Housing office"
              ],
              [
                "Room inventory",
                "Your items, counts and rough sizes",
                "Your own walk-through"
              ],
              [
                "Destination details",
                "Address, access, stairs or elevator, who will be present",
                "Landlord, program or family"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "Keep copies of any replies. If an answer is verbal, ask for a short email confirming it so you can share the relevant details with whoever is moving your belongings."
          }
        ]
      },
      {
        "heading": "Separate student belongings from school or roommate property",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Small moves go wrong when the item list is unclear. Walk through your space and sort things into groups before anyone estimates the shipment."
          },
          {
            "type": "list",
            "items": [
              "Yours and going with you: clothing, books, bedding, electronics, a mini-fridge or desk chair you own.",
              "Yours but staying or leaving another way: items you plan to donate, sell or ship separately.",
              "Provided by the school: standard furniture, mattresses or fixtures that belong to the housing program.",
              "Belongs to a roommate or friend: anything you are only holding or sharing.",
              "Unclear ownership: items to ask about before packing."
            ]
          },
          {
            "type": "paragraph",
            "text": "Only include the first group in your shipment scope. If something is borrowed or school-provided, confirm with its owner or the housing office before it is packed, and keep it out of any inventory you share."
          }
        ]
      },
      {
        "heading": "List compact-shipment and access details for written quotes",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total. For a small move, that means each estimate should describe the same shipment. Use your worksheet to prepare a short description you can reuse."
          },
          {
            "type": "list",
            "items": [
              "Approximate count of boxes, bags and larger pieces, with any oversized or fragile items noted.",
              "Whether you will pack yourself or want packing help.",
              "Pickup and delivery addresses, including floor, stairs or elevator, and any building access notes.",
              "The move window you confirmed for each location, and how flexible you are within it.",
              "Whether anyone must be present, and who that person is.",
              "Any storage gap between checkout and the new place, if you expect one."
            ]
          },
          {
            "type": "paragraph",
            "text": "When estimates arrive, compare what each one includes in writing rather than the total alone. If a description differs from yours, ask the company to correct it before you rely on it. For more on comparing, see [how to compare moving estimates](/questions/how-to-compare-moving-estimates/)."
          },
          {
            "type": "paragraph",
            "text": "If your room is only one part of a bigger change, the apartment moving checklist covers additional household tasks."
          }
        ]
      },
      {
        "heading": "Assign room access, checkout and destination receipt responsibilities",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move. For a student move, add the people who control access at each end."
          },
          {
            "type": "table",
            "columns": [
              "Task",
              "Person responsible",
              "Notes to confirm"
            ],
            "rows": [
              [
                "Be present at pickup or authorize access",
                "Name and phone",
                "Whether the building requires an escort or check-in"
              ],
              [
                "Complete room checkout",
                "Name",
                "Timing relative to the pickup window"
              ],
              [
                "Receive delivery at the destination",
                "Name and phone",
                "Who can sign and what ID or notice is needed"
              ],
              [
                "Be the contact during the move",
                "Name and phone",
                "Backup contact if classes or travel interfere"
              ],
              [
                "Handle questions about the written scope",
                "Name",
                "Where the quote and notes are saved"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "If a parent, friend or roommate will stand in for you, tell the provider and the housing office ahead of time, and check whether they need written permission. Pack a small bag with essentials, and see the first-night box checklist for ideas on what to keep within reach."
          },
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep the campus worksheet privately. If a company contacts you, discuss the student belongings, full pickup/delivery addresses and confirmed move windows directly, with unanswered housing-policy questions clearly marked for follow-up."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "UCLA Housing says undergraduate contract dates and move-in and move-out periods vary by assigned housing location. This is a UCLA example, not a rule for other schools.",
                "source": {
                  "label": "UCLA Housing: undergraduate contract dates",
                  "url": "https://ask.housing.ucla.edu/app/answers/detail/a_id/1797/~/undergraduate-contract-dates",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "UCLA Housing: undergraduate contract dates",
        "url": "https://ask.housing.ucla.edu/app/answers/detail/a_id/1797/~/undergraduate-contract-dates",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Can I use another school's move-out rules as a guide?",
        "answer": "Use them only as prompts for questions. UCLA Housing, for example, says move-in and move-out periods vary by assigned housing location, and that is specific to UCLA. Ask your own housing office for current instructions."
      },
      {
        "question": "What should I give providers when I ask for a quote?",
        "answer": "During a direct estimate conversation, share a consistent description of item counts and sizes, packing needs, both addresses, access details, confirmed move windows and who will be present. Keep those details in your worksheet; use the American Moving Choice form for its existing questions only."
      },
      {
        "question": "Who should be my contact on moving day?",
        "answer": "Choose someone reachable before, during and after the move, and share that contact with the provider. Name a backup in case you are in class, traveling or unable to answer."
      },
      {
        "question": "What if I am not sure which items belong to me?",
        "answer": "Leave them out of the shipment scope until you confirm ownership with the roommate, owner or housing office. A smaller, accurate list is easier to estimate than a longer uncertain one."
      }
    ],
    "related": [
      "planning:moving-from-an-apartment-checklist",
      "planning:first-night-box-checklist",
      "question:how-to-compare-moving-estimates"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "home-gym-moving-quote-preparation-checklist",
    "primaryKeyword": "home gym movers checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Home Gym Moving-Quote Checklist: Models, Access and Specialist Work",
    "h1": "Home gym moving-quote preparation checklist",
    "metaDescription": "Prepare a model-by-model equipment list before requesting moving quotes, and separate transport from any specialist preparation or reassembly work in writing.",
    "answer": "Before requesting quotes, list each exercise machine by brand and exact model, collect its owner manual, photograph it, and measure the route out of and into your homes. Then ask who handles any specialist preparation or reassembly, and get transport and specialist work written as separate responsibilities.",
    "sections": [
      {
        "heading": "Why a home gym needs its own quote preparation",
        "blocks": [
          {
            "type": "paragraph",
            "text": "\"Exercise equipment\" can mean a set of light dumbbells or a large machine with folding parts, wheels, handrails and a power connection. A generic inventory label does not give the provider the machine model, route or service responsibilities it needs to assess. The same word may describe items with very different handling and preparation needs."
          },
          {
            "type": "paragraph",
            "text": "This checklist helps you describe each machine clearly and ask who is responsible for what. It is a quote-preparation tool only. It does not tell you how to fold, lift, unplug, disassemble or reassemble anything. For those steps, use the manufacturer's manual for your exact model and follow the guidance of the provider doing the work."
          },
          {
            "type": "note",
            "text": "The worksheet below is an editorial suggestion, not a regulatory requirement. Adapt it to your equipment."
          }
        ]
      },
      {
        "heading": "Step 1: Record the brand, exact model and owner manual",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Start with a line for every machine, not one line for the whole gym. Find the brand and the exact model name or number, usually on a label or in your purchase records. Then locate the owner manual, or download the current one from the manufacturer for that exact model."
          },
          {
            "type": "paragraph",
            "text": "Model details matter because manufacturers do not treat all machines alike. As one limited example, [Horizon Fitness](https://help.horizonfitness.com/hc/en-us/articles/47020139681044-How-to-Fold-and-Move-Your-Treadmill) distinguishes between folding and non-folding treadmills and between different wheel arrangements in its moving guidance, and it refers readers to the owner manual for handrail assembly. That is one manufacturer's guidance for its own treadmills. It does not establish a moving method for other brands or other kinds of machines, so check your own model."
          },
          {
            "type": "list",
            "items": [
              "Brand and exact model for each machine",
              "Whether you have the owner manual, and where it is stored",
              "Whether the machine folds, has wheels, or has parts the manual says need separate attention",
              "Any missing parts, damage or prior repairs a provider should know about"
            ],
            "ordered": false
          }
        ]
      },
      {
        "heading": "Step 2: Photograph each machine and measure the access route",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Take clear photos of each machine from several angles, plus the model label if you can. Add a photo of the space it sits in. These help a company understand what it is being asked to move, but they do not replace a provider's own assessment."
          },
          {
            "type": "paragraph",
            "text": "Then record the route from the machine's spot to the truck at the origin, and from the truck to its intended room at the destination. Write down what you actually measure and see, not what you assume."
          },
          {
            "type": "list",
            "items": [
              "Doorway and hallway widths along the route",
              "Stairs, number of flights, turns and landings",
              "Elevator availability and size, if any",
              "Basement, garage or outdoor steps",
              "Distance from the door to where a truck could park",
              "Ceiling height or other tight spots in the destination room"
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "If you do not yet know the destination layout, mark it as unknown in your private equipment worksheet rather than guessing. If a company contacts you, discuss the missing measurements directly and ask what it needs to assess the route."
          }
        ]
      },
      {
        "heading": "Step 3: Ask who provides specialist preparation and reassembly",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Some machines may need preparation before transport or setup afterward, and the manual for your model may point to specific steps. Do not assume that a mover, the manufacturer or a separate technician will handle them. There is no universal promise that movers will reassemble equipment, so ask each company directly and get the answer in writing."
          },
          {
            "type": "paragraph",
            "text": "Useful questions to put to each provider:"
          },
          {
            "type": "list",
            "items": [
              "Does your quote include any preparation of this exact model before transport? If not, who would do it?",
              "Does it include reassembly or setup at the destination? If not, who would?",
              "Does the manufacturer's manual for this model call for a technician or specific steps, and how does your quote account for that?",
              "Are there machines on my list you would not handle, or would handle only through a separate specialist?",
              "If a separate specialist is needed, who arranges and pays for that visit, and when does it happen relative to the move?"
            ],
            "ordered": true
          }
        ]
      },
      {
        "heading": "Step 4: Compare transport and specialist work as separate written responsibilities",
        "blocks": [
          {
            "type": "paragraph",
            "text": "[FMCSA](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist) recommends obtaining several estimates and comparing the services provided, not only the quoted total. For a home gym, that means checking whether each quote covers the same work. One quote may include handling and transport of a machine while another leaves specialist tasks to you."
          },
          {
            "type": "paragraph",
            "text": "FMCSA also recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move. For specialist work, write down who you would contact and what the plan is if a setup visit is separate from delivery."
          },
          {
            "type": "paragraph",
            "text": "For more on reading scope line by line, see [how to compare moving estimates](/questions/how-to-compare-moving-estimates/), the [estimate service inclusions checklist](/planning/estimate-service-inclusions-checklist/) and the overview of specialty moving items."
          }
        ]
      },
      {
        "heading": "A model-specific equipment and service schedule",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Copy this table into a document and add a row per machine. Use the prompts below to record your own equipment and the provider answers; they do not describe a particular machine."
          },
          {
            "type": "table",
            "caption": "Home gym equipment and service schedule (editorial template)",
            "columns": [
              "Machine and exact model",
              "Owner manual",
              "Access notes",
              "Specialist work to confirm",
              "Written responsibility"
            ],
            "rows": [
              [
                "Machine 1 (for example, treadmill): write exact model",
                "Yes / No",
                "Stairs, doorways, elevator",
                "Per manual and provider answer",
                "Record transport provider and specialist"
              ],
              [
                "Machine 2: write exact model",
                "Yes / No",
                "Measured route notes",
                "Per manual and provider answer",
                "Record transport provider and specialist"
              ],
              [
                "Smaller items (weights, benches): list by type",
                "If applicable",
                "Packing and handling notes",
                "Ask the provider",
                "Written scope"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Keep the equipment schedule for provider conversations",
        "blocks": [
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep the model-specific equipment schedule privately. If a company contacts you, discuss the machines, access route and any specialist preparation or reassembly directly, then ask it to state the tasks it would accept in writing."
          },
          {
            "type": "note",
            "text": "AMC does not give binding quotes or arrange moves. Any price, service scope, specialist arrangement or availability comes from the company you speak with."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "Horizon Fitness distinguishes folding and non-folding treadmills and different wheel arrangements in its moving guidance, and refers readers to the owner manual for handrail assembly. This does not establish a moving method for other brands or machines.",
                "source": {
                  "label": "Horizon Fitness: folding and moving a treadmill",
                  "url": "https://help.horizonfitness.com/hc/en-us/articles/47020139681044-How-to-Fold-and-Move-Your-Treadmill",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "Horizon Fitness: folding and moving a treadmill",
        "url": "https://help.horizonfitness.com/hc/en-us/articles/47020139681044-How-to-Fold-and-Move-Your-Treadmill",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Do I need the owner manual before asking for quotes?",
        "answer": "It helps you prepare for a direct provider conversation. If you have lost the manual, check the manufacturer's site for the current manual for that exact model. Keep the model number and manual in your private equipment worksheet, and discuss them directly if a company contacts you."
      },
      {
        "question": "Will a moving company reassemble my exercise equipment?",
        "answer": "Do not assume so. Practices vary by company and by machine. Ask each provider whether reassembly is included for each specific model, and have the answer stated in the written scope."
      },
      {
        "question": "Does Horizon's treadmill guidance apply to my other machines?",
        "answer": "No. Horizon's guidance concerns its own treadmills and distinguishes between folding and non-folding models and between wheel arrangements. It is only an example of why exact models matter. Use the manual for each of your machines."
      },
      {
        "question": "Why should transport and specialist work be listed separately?",
        "answer": "They may be handled by different people at different times or prices. Separate lines make it easier to see what each quote covers, which supports FMCSA's recommendation to compare services and not only the total."
      }
    ],
    "related": [
      "service:specialty",
      "question:how-to-compare-moving-estimates",
      "planning:estimate-service-inclusions-checklist"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "pool-table-moving-quote-checklist",
    "primaryKeyword": "pool table movers checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Pool-Table Moving Quote and Specialist Checklist",
    "h1": "Pool-table moving quote and specialist checklist",
    "metaDescription": "Identify your actual pool table, describe access, and name who handles breakdown, slate, transport, reinstallation and leveling before you compare service offers.",
    "answer": "Before comparing pool-table moving offers, identify your table's maker, model and construction, describe both locations' access, and list every task: breakdown, slate handling, transport, reinstallation and finishing. Then ask that each accepted task and its responsible provider appear in writing. Compare the services described, not only the total.",
    "sections": [
      {
        "heading": "Why a pool table needs its own checklist",
        "blocks": [
          {
            "type": "paragraph",
            "text": "A pool table is not a typical piece of household furniture. It may be made of several heavy components, and the work involved can include taking it apart, protecting parts, transporting it, putting it back together and checking the result. A general mover's inventory line that says only \"pool table\" leaves most of those questions unanswered."
          },
          {
            "type": "paragraph",
            "text": "The federal moving guidance from FMCSA recommends getting several estimates and comparing the services provided, not only the quoted total. That advice fits pool tables especially well, because two offers with similar totals may cover very different tasks. The worksheet below is an editorial planning tool, not a legal or technical requirement."
          },
          {
            "type": "note",
            "text": "This article does not give table-specific assembly, slate-handling or leveling instructions. Those depend on your table's manufacturer and the specialist you hire. Do not try to handle slate yourself based on a general article."
          }
        ]
      },
      {
        "heading": "Step 1: Identify the actual table privately",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Start by gathering what you know about the table. Specialists can only describe their work accurately if they know what they are dealing with. Collect this information before a direct specialist conversation and keep it in your own notes."
          },
          {
            "type": "list",
            "items": [
              "Maker or brand name, and the model name or number if you can find it.",
              "Any manual, purchase paperwork or installer notes you still have.",
              "Table size, as best you can tell, and whether it is a home model or a larger commercial-style table.",
              "What the playing surface rests on, if known. Ask the specialist to confirm construction rather than guessing.",
              "Visible condition: worn cloth, damaged rails, previous repairs or loose parts.",
              "Any extras that travel with it, such as lights, cue racks, benches or a ball return."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "If you cannot identify the table, say so plainly to every specialist. Ask what they would need to see, such as photos of labels or the underside, and whether they would confirm details on site. Do not assume that a detail from one brand applies to yours."
          }
        ]
      },
      {
        "heading": "Step 2: Describe pickup and receiving-room access",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Access shapes how a table can leave one room and enter another. Describe both ends in the same level of detail so each specialist is working from the same facts."
          },
          {
            "type": "list",
            "items": [
              "Floor the table is on now, and floor it is going to.",
              "Stairs, turns, narrow halls or tight doorways along the route, and approximate widths if you have measured them.",
              "Distance from the room to where a vehicle can park, and any elevator or building rules at either address.",
              "Whether the receiving room is finished, cleared and ready, and whether the floor is level to your knowledge.",
              "Any furniture or fixtures that must be moved first to reach the table."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "If stairs or long carries are part of the route, see the related guide on stairs and long-carry charges so you know to ask how those are described in a written scope."
          }
        ]
      },
      {
        "heading": "Step 3: Separate the tasks before comparing offers",
        "blocks": [
          {
            "type": "paragraph",
            "text": "An unclear bundle of tasks makes offers difficult to compare. Ask each provider to describe the tasks separately, even if they later combine them in one total."
          },
          {
            "type": "paragraph",
            "text": "As one provider-specific example, Olhausen Gamerooms describes breakdown, transport, reinstallation and slate crating among its own pool-table relocation arrangements, according to [its relocation FAQ](https://olhausengo.com/faq/). That is one dealer's description of its own service. It is not evidence of what any other mover includes, and it does not imply that American Moving Choice has a relationship with that dealer. Use it only as a reminder of the kinds of tasks worth asking about."
          },
          {
            "type": "table",
            "caption": "Pool-table task questions to ask each provider",
            "columns": [
              "Task",
              "Question to ask",
              "What to look for in writing"
            ],
            "rows": [
              [
                "Breakdown",
                "Who takes the table apart at the pickup address?",
                "Named task and responsible provider"
              ],
              [
                "Slate and component protection",
                "How will heavy parts and the playing surface be protected for transport?",
                "Description of the method, in the provider's words"
              ],
              [
                "Transport",
                "Is the table moved on the same vehicle as other items or separately?",
                "Vehicle and handoff described"
              ],
              [
                "Reinstallation",
                "Who reassembles it at the new address?",
                "Included or excluded, stated clearly"
              ],
              [
                "Leveling and finishing",
                "Is leveling or cloth work part of the offer?",
                "Included, extra, or not offered"
              ],
              [
                "Delivery access",
                "Who handles stairs or tight turns?",
                "Route assumptions noted"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Step 4: Name who is responsible for each accepted task",
        "blocks": [
          {
            "type": "paragraph",
            "text": "If you consider using a general mover for the household shipment and a pool-table specialist for separate tasks, write down where their responsibilities meet. If one company proposes subcontracted work, ask who performs it and who your contact will be. Compare those proposed arrangements in writing rather than assuming either is included."
          },
          {
            "type": "list",
            "items": [
              "List every task from the table above and mark which provider will perform it.",
              "Ask for the scope in writing, including exclusions, and compare it against the other offers you receive.",
              "Confirm pickup and delivery arrangements and how to reach the provider before, during and after the move, which FMCSA recommends establishing.",
              "Ask how the table will be coordinated with the rest of your shipment so arrival dates and access are not left to chance.",
              "Ask what happens if the room is not ready or access differs from what you described.",
              "Keep the written scope with your other moving paperwork."
            ],
            "ordered": true
          },
          {
            "type": "paragraph",
            "text": "For help comparing what any estimate includes, use the [estimate service inclusions checklist](/planning/estimate-service-inclusions-checklist/). For other items that need special handling, see specialty moving services."
          },
          {
            "type": "note",
            "text": "Ask the specialist to describe any accepted setup or leveling work in writing. If you have questions about a manufacturer or dealer warranty, direct them to that company separately; do not infer warranty protection from a transport quote."
          }
        ]
      },
      {
        "heading": "Keep the pool-table checklist for provider conversations",
        "blocks": [
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep the pool-table checklist privately. If a company contacts you, discuss the maker, model, access route and specialist tasks directly; ask which work it would accept rather than assuming the household request covers every task."
          },
          {
            "type": "paragraph",
            "text": "During a direct company conversation, ask which pool-table tasks it would perform and whether a separate specialist would be needed. Record a named provider for every accepted task, along with the handoff and contact arrangements, before comparing the complete written offers."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "Olhausen Gamerooms describes breakdown, transport, reinstallation and slate crating among its own pool-table relocation arrangements. This is one provider example, not a service inclusion or warranty promise from other movers.",
                "source": {
                  "label": "Olhausen Gamerooms: its pool-table relocation FAQ",
                  "url": "https://olhausengo.com/faq/",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "Olhausen Gamerooms: its pool-table relocation FAQ",
        "url": "https://olhausengo.com/faq/",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Do I need a specialist to move a pool table?",
        "answer": "That depends on the table and what the movers you talk to are set up to do. Ask each provider who will perform breakdown, transport, reinstallation and finishing, and get the answer in writing so you can compare real scopes."
      },
      {
        "question": "Should I take the table apart myself to save effort?",
        "answer": "This article does not offer disassembly or slate-handling instructions. Heavy components and manufacturer-specific construction make it a task to discuss with the specialist, who should say in writing what they will and will not do."
      },
      {
        "question": "Does the Olhausen example mean other movers offer the same services?",
        "answer": "No. It shows only how one dealer describes its own relocation arrangements, including breakdown, transport, reinstallation and slate crating. Other providers may offer different services, so ask each for its own written scope."
      },
      {
        "question": "What if I do not know my table's maker or model?",
        "answer": "Say so up front. Look for labels, a manual or purchase records, and ask each specialist what photos or on-site checks they need to confirm the details."
      },
      {
        "question": "Will a written scope guarantee a level table after the move?",
        "answer": "Ask the provider to state whether leveling or setup is included and how that work will be checked. Do not infer those services from a quote that describes transport only; keep warranty questions separate with the relevant manufacturer or dealer."
      }
    ],
    "related": [
      "service:specialty",
      "planning:estimate-service-inclusions-checklist",
      "question:do-movers-charge-for-stairs-and-long-carries"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  },
  {
    "family": "planning",
    "slug": "antique-furniture-moving-survey-checklist",
    "primaryKeyword": "antique furniture movers checklist",
    "intent": "informational",
    "supportingKeywords": [],
    "title": "Antique Furniture Moving-Survey Checklist",
    "h1": "Antique furniture moving-survey checklist",
    "metaDescription": "Build an object-level record of condition, prior repairs and packing responsibility so you can compare antique furniture moving services in writing.",
    "answer": "Before asking anyone to move antique furniture, write a record for each piece: identity, dimensions, current condition, loose joints, past repairs, sensitive finishes and access limits. Then ask whether a conservator should advise first, and get packing, handling and unpacking responsibilities in writing. This lets you compare services, not just totals, and keeps conservation questions separate from ordinary moving work.",
    "sections": [
      {
        "heading": "Start with a private record of each object",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Make one entry per piece rather than a general note such as \"antique furniture, living room.\" A cabinet, a chair set and a table with leaves each raise different questions, and a provider can only respond to what you actually describe. Keep the full record for yourself and share the parts a provider needs to understand the job."
          },
          {
            "type": "paragraph",
            "text": "The worksheet below is an editorial suggestion, not a regulator form. Adapt it to the piece."
          },
          {
            "type": "table",
            "caption": "Object identity and condition worksheet (suggested fields)",
            "columns": [
              "Field",
              "What to record",
              "Why it helps"
            ],
            "rows": [
              [
                "Object name",
                "Your own label, such as \"walnut chest, hall\" and the room it is in",
                "Lets you and a provider refer to the same item"
              ],
              [
                "Dimensions",
                "Height, width and depth as you measured them, plus any parts that detach",
                "Helps a provider picture the item and its route out of the home"
              ],
              [
                "Components",
                "Drawers, shelves, leaves, glass, hardware, keys, removable tops",
                "Shows what must travel with the piece and what could be separated"
              ],
              [
                "Current condition",
                "Dated photos of every side, plus close-ups of anything already damaged",
                "Gives a baseline to compare against after delivery"
              ],
              [
                "Access",
                "Stairs, narrow doorways, elevators, tight turns, long carries at pickup and delivery",
                "Lets a provider assess handling before the move day"
              ],
              [
                "Open questions",
                "Anything you are unsure about, such as a wobble or a lifting finish",
                "Turns uncertainty into questions you can ask"
              ]
            ]
          },
          {
            "type": "note",
            "text": "Use this record to describe the object and its condition; it is not an appraisal. Keep any separate valuation questions for the appropriate provider or adviser rather than inventing a figure in this worksheet."
          }
        ]
      },
      {
        "heading": "Check loose joints, components, past repairs and finishes",
        "blocks": [
          {
            "type": "paragraph",
            "text": "The Canadian Conservation Institute recommends checking wooden furniture for damage or loose joints before moving it. That check is the heart of this section: look at the piece with the purpose of noting what you see, not fixing it. See the [Canadian Conservation Institute guidance on basic care of wooden furniture](https://www.canada.ca/en/conservation-institute/services/care-objects/furniture-wooden-objects-basketry/basic-care-furniture-objects-wood.html) for the source of that recommendation."
          },
          {
            "type": "list",
            "items": [
              "Loose joints: note any wobble, gap or movement you can see in legs, rails, arms or frames, and which side it is on.",
              "Damage: record cracks, splits, chips, missing pieces and areas that look previously broken.",
              "Past repairs: write down any repair you know about, who did it if you know, and roughly when. If you are not sure whether something is a repair, say so rather than guessing.",
              "Sensitive finishes: note areas where the surface looks flaking, worn, cloudy, sticky or lifting, and any veneer, paint, gilding or inlay you can identify.",
              "Attached parts: record hardware, mirrors, glass panels, castors and anything that already seems loose.",
              "Unknowns: list what you cannot judge. Those items become questions for a specialist or provider."
            ],
            "ordered": false
          },
          {
            "type": "paragraph",
            "text": "Resist the urge to test a loose joint by pushing or flexing it. Describe what you notice during ordinary, careful observation. This checklist offers no repair, cleaning or restoration steps."
          }
        ]
      },
      {
        "heading": "Separate conservation questions from ordinary moving work",
        "blocks": [
          {
            "type": "paragraph",
            "text": "Moving a piece and conserving a piece are different jobs. The Canadian Conservation Institute recommends referring extensive repair or cleaning to a conservator. Keep extensive repair and cleaning questions separate from the transport and handling scope you ask a moving provider to assess."
          },
          {
            "type": "paragraph",
            "text": "Use your record to decide whether to ask a conservator or other specialist for advice before transport. Reasonable triggers for asking, as an editorial suggestion, are visible damage, several loose joints, fragile or flaking finishes, or a past repair you cannot assess. You do not need to settle the answer alone; the purpose is to ask the question before move day rather than during it."
          },
          {
            "type": "list",
            "items": [
              "Review your worksheet and mark every entry with a visible concern or unknown.",
              "Decide whether any of those concerns call for specialist advice before the piece is moved.",
              "If you consult a specialist, ask what they advise for transport and write down their answer in your own words, noting who gave it and when.",
              "Share only the relevant advice with providers, and ask how their service would address it.",
              "If conservation expertise is relevant, ask for suitable qualifications and check them; a transport offer alone does not answer that question."
            ],
            "ordered": true
          }
        ]
      },
      {
        "heading": "Agree who supplies packing, handling and unpacking",
        "blocks": [
          {
            "type": "paragraph",
            "text": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total. For antiques, that comparison is most useful at the object level. Two quotes with similar totals can describe different work. Review the [FMCSA moving checklist](https://www.fmcsa.dot.gov/protect-your-move/moving-checklist) for the general planning context."
          },
          {
            "type": "table",
            "caption": "Written-scope questions for each piece",
            "columns": [
              "Question",
              "What a clear answer looks like"
            ],
            "rows": [
              [
                "Who packs this piece?",
                "A named party and the materials or method they plan to use for this specific object"
              ],
              [
                "Who handles it at pickup and delivery?",
                "A description of the people and equipment, including how access limits will be managed"
              ],
              [
                "Who unpacks it and places it?",
                "A statement of whether unpacking, reassembly and placement are included or excluded"
              ],
              [
                "What happens with detachable parts?",
                "A statement of how leaves, shelves, glass, keys and hardware will be kept with the piece"
              ],
              [
                "How is existing condition acknowledged?",
                "A way to compare your dated photos and notes against condition at delivery"
              ],
              [
                "What is excluded?",
                "Any task the provider says it will not perform, written plainly"
              ]
            ]
          },
          {
            "type": "paragraph",
            "text": "FMCSA also recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move. Add that to your record: who will be present at each address, and how you can reach the provider if something about the piece changes. Keep every answer in writing so you can compare providers on the same terms."
          }
        ]
      },
      {
        "heading": "Keep object records for provider conversations",
        "blocks": [
          {
            "type": "paragraph",
            "text": "To [request moving quotes](/get-quotes/), complete the existing ZIP code, date, home-size, service, contact and company-limit questions. Keep the full object and condition records privately. If a company contacts you, discuss the pieces, access limits and relevant specialist advice directly, sharing only the details it needs to assess the work."
          },
          {
            "type": "paragraph",
            "text": "In that direct conversation, ask the company to describe the packing, handling and unpacking it would accept for those pieces, including exclusions. Compare its written scope with your condition notes and resolve conservation questions separately before relying on a transport plan."
          },
          {
            "type": "paragraph",
            "text": "For related planning, see the high-value article schedule checklist and the pickup condition photo inventory checklist."
          }
        ]
      },
      {
        "heading": "Sourced reference points",
        "blocks": [
          {
            "type": "facts",
            "items": [
              {
                "claim": "FMCSA recommends obtaining several estimates and comparing the services provided, not only the quoted total.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "FMCSA recommends establishing pickup and delivery arrangements and how to contact the provider before, during and after the move.",
                "source": {
                  "label": "FMCSA Moving Checklist",
                  "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
                  "accessedOn": "2026-10-30"
                }
              },
              {
                "claim": "The Canadian Conservation Institute recommends checking wooden furniture for damage or loose joints before moving it and referring extensive repair or cleaning to a conservator.",
                "source": {
                  "label": "Canadian Conservation Institute: basic care of wooden furniture",
                  "url": "https://www.canada.ca/en/conservation-institute/services/care-objects/furniture-wooden-objects-basketry/basic-care-furniture-objects-wood.html",
                  "accessedOn": "2026-10-30"
                }
              }
            ]
          }
        ]
      }
    ],
    "factTopics": [],
    "sources": [
      {
        "label": "FMCSA Moving Checklist",
        "url": "https://www.fmcsa.dot.gov/protect-your-move/moving-checklist",
        "accessedOn": "2026-10-30"
      },
      {
        "label": "Canadian Conservation Institute: basic care of wooden furniture",
        "url": "https://www.canada.ca/en/conservation-institute/services/care-objects/furniture-wooden-objects-basketry/basic-care-furniture-objects-wood.html",
        "accessedOn": "2026-10-30"
      }
    ],
    "faq": [
      {
        "question": "Do I need a conservator before moving every antique?",
        "answer": "Not necessarily, and this checklist does not set a rule. The Canadian Conservation Institute recommends checking wooden furniture for damage or loose joints before moving it and referring extensive repair or cleaning to a conservator. If your record shows visible damage or concerns you cannot judge, asking a specialist before transport is a reasonable step."
      },
      {
        "question": "Should I fix a loose joint before the move?",
        "answer": "This checklist gives no repair instructions. Record the loose joint, note where it is, and raise it with a specialist or provider. Extensive repair is a conservation matter, separate from ordinary moving work."
      },
      {
        "question": "What should I compare between providers besides the total?",
        "answer": "Compare the services described for each piece: who packs, who handles it, who unpacks, how detachable parts are kept together, what is excluded and how you can contact the provider before, during and after the move. FMCSA recommends comparing the services provided, not only the quoted total."
      }
    ],
    "related": [
      "service:specialty",
      "planning:moving-high-value-article-schedule-checklist",
      "planning:pickup-condition-photo-inventory-checklist"
    ],
    "publicationCohort": "amc-claude-pilot-2026-10-30-v1"
  }
];

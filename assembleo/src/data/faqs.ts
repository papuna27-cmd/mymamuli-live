/**
 * FAQ blocks. Each key is rendered by a page and emitted as FAQPage JSON-LD.
 * Answers are plain text so the markup and the structured data cannot drift.
 */

export interface Faq {
  q: string;
  a: string;
}

export const faqs: Record<string, Faq[]> = {
  assembly: [
    {
      q: 'How much does furniture assembly cost?',
      a: 'Assembly is priced per item, or as a half or full day for bigger jobs. Send us the product links or a photo of the boxes and you will have a fixed price back, usually within two hours. We do not charge a call-out fee on top.',
    },
    {
      q: 'Do I need to unbox everything before you arrive?',
      a: 'No. Unboxing is part of the job. What helps is having all the boxes in the room where the furniture is going, and the floor clear enough to lay parts out.',
    },
    {
      q: 'What happens if a part is missing or damaged?',
      a: 'We stop, photograph it, and give you the part number and the damage note you need for the retailer. You claim the part; we come back and finish once it arrives, and the return visit is half price.',
    },
    {
      q: 'Do you anchor furniture to the wall?',
      a: 'Yes, and we recommend it for anything taller than it is wide, especially with kids in the house. It is a small extra charge because it depends on your wall — drywall, plaster, concrete and steel studs all need different fixings.',
    },
    {
      q: 'How long does assembly usually take?',
      a: 'A dresser or a bed frame is about an hour. A wardrobe with sliding doors is two to four. A multi-station home gym or a large media wall is most of a day. We will tell you the estimate when we quote, not when we arrive.',
    },
    {
      q: 'Will you assemble furniture I bought second-hand?',
      a: 'Yes, as long as the hardware is there and the instructions exist somewhere — the manufacturer usually has a PDF. If parts are missing we will tell you before we start rather than halfway through.',
    },
    {
      q: 'Can you deliver and assemble on the same visit?',
      a: 'Yes, and it is cheaper than booking them apart because it is one trip. Say so when you book so we allow the time.',
    },
    {
      q: 'Are you insured?',
      a: 'Yes. We carry $2M commercial general liability and our crew is covered by WSIB. We can send the certificate before we arrive if you or your building need it.',
    },
  ],

  delivery: [
    {
      q: 'How much does delivery cost?',
      a: 'A $90 base fee plus $5 for every kilometre of one-way driving distance, with a $150 minimum before tax. That minimum works out to $169.50 with HST and covers any job up to about 12 km. The calculator on this page gives you the exact breakdown.',
    },
    {
      q: 'What size items can you carry?',
      a: 'Our vans take about 3 m of cargo length — a three-seat sofa, a dining set, a mattress and boxes on the same run. If you are moving a whole apartment, that is more than one trip and you should tell us up front.',
    },
    {
      q: 'Do you carry it upstairs?',
      a: 'A delivery includes carrying it to the room of your choice on the entry floor. Above or below that is extra, and it is much cheaper if you tell us when booking than when we are standing in your hallway.',
    },
    {
      q: 'Can you collect from two different stores?',
      a: 'Yes, on the same run for a second-stop charge, as long as both pickups are on the way. Ask when you book so we can route it.',
    },
    {
      q: 'What do you need from me for the store pickup?',
      a: 'The order number, the store and its pickup hours, and anything the retailer needs to release goods to a third party — most want the name on the order to authorise us in advance. Sort that out first and the pickup takes ten minutes.',
    },
    {
      q: 'What if the furniture does not fit through my door?',
      a: 'Measure the doorway, the turn at the top of the stairs and the elevator before you buy. If it genuinely will not fit, we will leave it somewhere safe and secure such as your garage or entry, and the delivery is still charged — we drove it there.',
    },
    {
      q: 'How soon can you deliver?',
      a: 'Often the next day, and same day if you catch us early and the store is on our route. Weekends book out first.',
    },
  ],

  moving: [
    {
      q: 'What does "curbside to curbside" actually mean?',
      a: 'The crew loads at the vehicle and unloads at the vehicle. Carrying items up or down floors is not part of a moving job — not one flight, not a walk-up, not a basement. Your furniture needs to be at ground level and reachable from where we can legally park, at both addresses.',
    },
    {
      q: 'Can you carry it up the stairs if I pay more?',
      a: 'Usually yes, but it has to be quoted before the day. Tell us the item, how many flights, and whether there is an elevator, and we will price it. What we cannot do is decide it on your driveway with the van running.',
    },
    {
      q: 'How much does moving cost?',
      a: 'A $70 base fee plus $5 for every kilometre of one-way driving distance, with a $130 minimum before tax. That minimum works out to $146.90 with HST and covers any job up to about 12 km. Use the calculator on this page for the exact figure.',
    },
    {
      q: 'Is the distance one-way or return?',
      a: 'One way — the driving distance from the pickup address to the destination. You are not charged for our drive back.',
    },
    {
      q: 'How much can you move in one booking?',
      a: 'About a van load: a sofa, a bed, a dresser and some boxes. If it is more than that, it is two runs, and it is cheaper to book them together than to find out on the day.',
    },
    {
      q: 'Do you take beds apart and put them back together?',
      a: 'That is disassembly and reassembly, which is an assembly job on top of the move. We are happy to do it, it just needs to be booked so the time exists.',
    },
    {
      q: 'Is my furniture covered if something goes wrong?',
      a: 'We carry $2M commercial general liability and everything gets blanket-wrapped and strapped for the drive. We photograph any existing damage before it goes in the van, which protects both of us.',
    },
    {
      q: 'What if there is nowhere to park?',
      a: 'We need a legal spot within a reasonable carry of the item at both ends. Downtown Toronto and older condo buildings often need a booked loading dock or a street permit, and arranging that is the customer’s side of the job. Tell us what the access is like and we will plan around it.',
    },
  ],

  commercial: [
    {
      q: 'How do you price commercial work?',
      a: 'On unit count and site conditions, not per item. Send a furniture list, a purchase order or a floor plan and you will get a fixed project price and a date — not an hourly rate that grows.',
    },
    {
      q: 'Can you work outside our business hours?',
      a: 'Yes. Most of our gym, clinic, hotel and retail work happens in the evening, overnight or on a weekend, because that is when the floor is free. Say what window you need and we will schedule into it.',
    },
    {
      q: 'Do you provide a certificate of insurance?',
      a: 'Yes, before the first visit. $2M commercial general liability, and a WSIB clearance certificate. Property managers and building operators usually want both, and we will send them to your name on file.',
    },
    {
      q: 'What are your payment terms?',
      a: 'Net 30 on an approved account. First project is typically a deposit and balance on completion, then we set up terms once we have worked together.',
    },
    {
      q: 'Can you receive and stage deliveries for us?',
      a: 'Yes. We can co-ordinate with your supplier, receive the goods, check the count against the packing list and stage them by room or unit so the install runs in one pass.',
    },
    {
      q: 'Do you handle multi-unit turnovers?',
      a: 'That is a lot of what we do — student housing, rental portfolios and furnished suites where twenty identical units need the same four items by the same date. We work to a unit list and hand back a completion record with photos.',
    },
    {
      q: 'What is the smallest commercial job you take?',
      a: 'A half day. Below that it is cheaper for you to book it as a residential assembly, and we will tell you so rather than sell you the bigger thing.',
    },
  ],

  general: [
    {
      q: 'Which areas do you cover?',
      a: 'Mississauga, Toronto, Brampton, Oakville, Etobicoke, Vaughan and Hamilton, plus most of what sits between them. Our vans are based in Mississauga, so the closer you are the sooner we can usually get to you.',
    },
    {
      q: 'How do I get a price?',
      a: 'For delivery and moving, use the calculator — it gives you a breakdown in about thirty seconds. For assembly and commercial work, send the item list or the product links through the booking form and we will come back with a fixed price, usually within two hours.',
    },
    {
      q: 'Is the calculator price the final price?',
      a: 'It is an estimate based on the distance between the two addresses. It is confirmed when you book, once we know the item and the access. We do not add fees afterwards that we did not tell you about.',
    },
    {
      q: 'How do I pay?',
      a: 'Card, e-transfer or cash on the day for residential jobs. Commercial accounts are invoiced on net 30.',
    },
    {
      q: 'What if I need to reschedule?',
      a: 'Let us know the day before and there is no charge. Same-day cancellations are charged the minimum call-out, because the slot is gone by then.',
    },
  ],
};

export function getFaqs(key: string): Faq[] {
  return faqs[key] ?? [];
}

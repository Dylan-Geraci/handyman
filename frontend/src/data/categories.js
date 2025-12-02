// src/data/categories.js

export const categories = [
  {
    id: 'assembly',
    name: 'Assembly',
    description: 'Furniture, exercise equipment, IKEA builds, and more.',
    tasks: [
      {
        id: 'furniture-assembly',
        name: 'Furniture Assembly',
        keywords: [
          'put together furniture',
          'build furniture',
          'bed frame',
          'desk',
          'dresser',
          'table'
        ],
        shortDescription: 'Help putting together beds, desks, dressers, and more.'
      },
      {
        id: 'exercise-equipment-assembly',
        name: 'Exercise Equipment Assembly',
        keywords: ['treadmill', 'elliptical', 'home gym'],
        shortDescription: 'Assembly for treadmills, ellipticals, and home gyms.'
      },
      {
        id: 'bike-assembly',
        name: 'Bike Assembly',
        keywords: ['assemble bike', 'put together bike'],
        shortDescription: 'Professional help assembling new bikes.'
      }
    ]
  },
  {
    id: 'mounting',
    name: 'Mounting & Installation',
    description: 'TVs, shelves, decor, curtains, and more.',
    tasks: [
      {
        id: 'tv-mounting',
        name: 'TV Mounting',
        keywords: ['mount tv', 'hang tv', 'wall mount tv'],
        shortDescription: 'Securely mount TVs of all sizes.'
      },
      {
        id: 'shelf-mounting',
        name: 'Shelf Mounting',
        keywords: ['mount shelves', 'hang shelves'],
        shortDescription: 'Install shelves and storage.'
      },
      {
        id: 'picture-hanging',
        name: 'Picture & Mirror Hanging',
        keywords: ['hang pictures', 'hang mirror', 'wall art'],
        shortDescription: 'Hang pictures, mirrors, and wall art.'
      }
    ]
  },
  {
    id: 'moving',
    name: 'Moving & Heavy Lifting',
    description: 'Help moving, loading, unloading, and rearranging.',
    tasks: [
      {
        id: 'help-moving',
        name: 'Help Moving',
        keywords: ['moving help', 'move boxes', 'move apartment'],
        shortDescription: 'General moving assistance and box carrying.'
      },
      {
        id: 'heavy-lifting',
        name: 'Heavy Lifting',
        keywords: ['lift couch', 'move furniture', 'heavy items'],
        shortDescription: 'Extra muscle for bulky items.'
      }
    ]
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    description: 'Standard, deep, and move-out cleaning.',
    tasks: [
      {
        id: 'standard-cleaning',
        name: 'Standard Cleaning',
        keywords: ['house cleaning', 'basic cleaning'],
        shortDescription: 'Recurring or one-time home cleaning.'
      },
      {
        id: 'deep-cleaning',
        name: 'Deep Cleaning',
        keywords: ['deep clean', 'move out cleaning'],
        shortDescription: 'Deep or move-out cleaning projects.'
      }
    ]
  },
  {
    id: 'handyman',
    name: 'General Handyman',
    description: 'Repairs, minor fixes, and odd jobs.',
    tasks: [
      {
        id: 'minor-home-repairs',
        name: 'Minor Home Repairs',
        keywords: ['fix door', 'fix cabinet', 'small repairs'],
        shortDescription: 'Small repairs and fixes around the house.'
      },
      {
        id: 'furniture-repair',
        name: 'Furniture Repair',
        keywords: ['fix furniture', 'repair furniture'],
        shortDescription: 'Repair wobbly, broken, or damaged furniture.'
      }
    ]
  }
];

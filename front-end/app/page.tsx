'use client';

export default function Home() {
  const items = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    title: `Model ${i + 1}`,
    author: `Author ${i + 1}`,
    price: `SAT ${(i + 1) * 10}`,
    link: `/model/${i + 1}`,
  }));

  return (
    <>
      <div className="grid grid-cols-3 gap-4 p-4 my-16 w-3/5 mx-auto">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.link}
            className="border border-[#333] p-4 rounded-md shadow hover:shadow-lg transition"
          >
            <div className="bg-[#333] h-32 mb-4 flex items-center justify-center rounded-lg">
              <span className="text-gray-500">----</span>
            </div>
            <h2 className="text-lg font-bold">{item.title}</h2>
            <p className="text-sm text-gray-600">{item.author}</p>
            <p className="text-sm font-semibold">{item.price}</p>
          </a>
        ))}
      </div>
    </>
  );
}

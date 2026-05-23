import { useState, useRef, useEffect } from 'react'

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia',
  'Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Belarus','Belgium','Belize',
  'Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei',
  'Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada','Cape Verde',
  'Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo',
  'Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti',
  'Dominican Republic','Ecuador','Egypt','El Salvador','Estonia','Ethiopia','Fiji',
  'Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Guatemala',
  'Guinea','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq',
  'Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait',
  'Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein',
  'Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta',
  'Mauritania','Mauritius','Mexico','Moldova','Monaco','Mongolia','Montenegro','Morocco',
  'Mozambique','Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua',
  'Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
  'Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Sierra Leone',
  'Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan',
  'Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan',
  'Tanzania','Thailand','Togo','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan',
  'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay',
  'Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
]

export default function CountrySelect({ value, onChange, error }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const searchRef = useRef(null)

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(country) {
    onChange(country)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label className="text-sm font-medium text-gray-700">
        Country <span className="text-red-500">*</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full border rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between bg-white transition-colors
          ${error ? 'border-red-400' : 'border-gray-200'}
          ${value ? 'text-gray-800' : 'text-gray-400'}
          focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400`}
      >
        <span>{value || 'Select Country'}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {open && (
        <div className="absolute z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          style={{ width: 'calc(100% - 0px)', maxWidth: '400px' }}>
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-2 text-sm text-gray-400">No results</li>
            )}
            {filtered.map((country) => (
              <li key={country}>
                <button
                  type="button"
                  onClick={() => select(country)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-violet-50 transition-colors
                    ${value === country ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-700'}`}
                >
                  {country}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

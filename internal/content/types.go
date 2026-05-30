package content

type Class struct {
	ID          string           `json:"id"`
	Grade       int              `json:"grade"`
	Name        string           `json:"name"`
	Tagline     string           `json:"tagline"`
	Description string           `json:"description"`
	Icon        string           `json:"icon"`
	Color       string           `json:"color"`
	Subjects    []Subject        `json:"subjects"`
	Chapters    []ChapterSummary `json:"chapters"`
}

type Subject struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}

type ChapterSummary struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Subject  string `json:"subject"`
	Icon     string `json:"icon"`
	Summary  string `json:"summary"`
	ReadTime string `json:"readTime"`
}

type Chapter struct {
	ID             string              `json:"id"`
	ClassID        string              `json:"classId"`
	Name           string              `json:"name"`
	Subject        string              `json:"subject"`
	Icon           string              `json:"icon"`
	Summary        string              `json:"summary"`
	ReadTime       string              `json:"readTime"`
	ChapterSummary *ChapterSummaryFull `json:"chapterSummary,omitempty"`
	Crushed        []CrushedPoint      `json:"crushed"`
	Sections       []Section           `json:"sections"`
	Flows          []Flow              `json:"flows"`
	Demos          []Demo              `json:"demos,omitempty"`
	KeyTerms       []KeyTerm           `json:"keyTerms"`
	Compare        []ComparePair       `json:"compare,omitempty"`
	Related        []string            `json:"related,omitempty"`
}

type ChapterSummaryFull struct {
	Overview  string   `json:"overview"`
	KeyPoints []string `json:"keyPoints"`
	ExamFocus string   `json:"examFocus"`
}

type Demo struct {
	ID          string         `json:"id"`
	Title       string         `json:"title"`
	Type        string         `json:"type"`
	Scene       string         `json:"scene,omitempty"`
	Description string         `json:"description"`
	Equation    string         `json:"equation,omitempty"`
	Conditions  string         `json:"conditions,omitempty"`
	Effect      string         `json:"effect,omitempty"`
	Reactants   []DemoParticle `json:"reactants,omitempty"`
	Products    []DemoParticle `json:"products,omitempty"`
	Steps       []DemoStep     `json:"steps,omitempty"`
}

type DemoParticle struct {
	Symbol      string `json:"symbol"`
	Name        string `json:"name"`
	Color       string `json:"color"`
	State       string `json:"state,omitempty"`
	Kind        string `json:"kind,omitempty"`
	CloudColor  string `json:"cloudColor,omitempty"`
	BeakerColor string `json:"beakerColor,omitempty"`
}

type DemoStep struct {
	Label       string `json:"label"`
	Description string `json:"description"`
	Visual      string `json:"visual,omitempty"`
}

type CrushedPoint struct {
	Emoji string `json:"emoji"`
	Title string `json:"title"`
	Text  string `json:"text"`
}

type Section struct {
	ID         string        `json:"id"`
	Title      string        `json:"title"`
	Intro      string        `json:"intro,omitempty"`
	VisualType string        `json:"visualType,omitempty"`
	Items      []SectionItem `json:"items,omitempty"`
}

type SectionItem struct {
	Label       string `json:"label"`
	Detail      string `json:"detail"`
	Icon        string `json:"icon,omitempty"`
	Highlight   bool   `json:"highlight,omitempty"`
}

type Flow struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Steps       []FlowStep `json:"steps"`
}

type FlowStep struct {
	Label       string   `json:"label"`
	Action      string   `json:"action"`
	Description string   `json:"description"`
	Icon        string   `json:"icon,omitempty"`
	Highlight   []string `json:"highlight,omitempty"`
}

type KeyTerm struct {
	Term       string `json:"term"`
	Definition string `json:"definition"`
	Analogy    string `json:"analogy,omitempty"`
}

type ComparePair struct {
	Title   string       `json:"title"`
	Left    CompareSide  `json:"left"`
	Right   CompareSide  `json:"right"`
}

type CompareSide struct {
	Label  string   `json:"label"`
	Points []string `json:"points"`
}
